"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2, Circle, Loader2, ShieldCheck, Upload, FileText } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import companyService from "@/app/api/company/endpoints";
import type { Agreement } from "@/app/api/agreements/types";

type Step = "loading" | "review" | "otp" | "already-signed" | "done";

const DOC_TYPES: Array<{ type: "B2B_AGREEMENT" | "DPA"; labelKey: "b2bAgreement" | "dpa" }> = [
  { type: "B2B_AGREEMENT", labelKey: "b2bAgreement" },
  { type: "DPA", labelKey: "dpa" },
];

export default function SignAgreementsPage() {
  const t = useTranslations("dashboard.business.signAgreements");
  const router = useRouter();
  const locale = useLocale();
  const DOC_ORDER = DOC_TYPES.map((d) => ({ type: d.type, label: t(`docLabels.${d.labelKey}`) }));

  const [step, setStep] = useState<Step>("loading");
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [scrolledToBottom, setScrolledToBottom] = useState<Record<string, boolean>>({});

  const [signatoryName, setSignatoryName] = useState("");
  const [authConfirmed, setAuthConfirmed] = useState(false);
  const [stampFile, setStampFile] = useState<File | null>(null);
  const [uploadingStamp, setUploadingStamp] = useState(false);
  const [stampUploaded, setStampUploaded] = useState(false);

  const [sending, setSending] = useState(false);
  const [otpReference, setOtpReference] = useState("");
  const [sentTo, setSentTo] = useState("");
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [confirming, setConfirming] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendsRemaining, setResendsRemaining] = useState(5);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [signedDocs, setSignedDocs] = useState<Agreement[]>([]);

  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await agreementService.getStatus();
        const signed = new Set(status.filter((a) => a.status === "SIGNED").map((a) => a.agreement_type));
        if (!active) return;

        if (DOC_ORDER.every((d) => signed.has(d.type))) {
          setStep("already-signed");
          return;
        }

        const [b2b, dpa] = await Promise.all([
          agreementService.getPreview("B2B_AGREEMENT"),
          agreementService.getPreview("DPA"),
        ]);
        if (!active) return;
        setPreviews({ B2B_AGREEMENT: b2b.html, DPA: dpa.html });
        setStep("review");
      } catch (err) {
        console.error("Failed to load agreements:", err);
        if (active) setError(t("loadFailedError"));
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const formatCountdown = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const currentDoc = DOC_ORDER[activeDocIndex];
  const allDocsReviewed = DOC_ORDER.every((d) => scrolledToBottom[d.type]);

  const handleIframeScroll = (docType: string) => (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const win = e.currentTarget.contentWindow;
    if (!win) return;
    const doc = win.document;
    const atBottom =
      doc.documentElement.scrollHeight - win.scrollY - win.innerHeight < 40;
    if (atBottom) {
      setScrolledToBottom((prev) => (prev[docType] ? prev : { ...prev, [docType]: true }));
    }
  };

  // Fallback: some iframe/print-CSS documents don't fire scroll reliably —
  // also mark reviewed once the user has spent a few seconds on the doc.
  useEffect(() => {
    if (step !== "review") return;
    const timer = setTimeout(() => {
      setScrolledToBottom((prev) => ({ ...prev, [currentDoc.type]: true }));
    }, 6000);
    return () => clearTimeout(timer);
  }, [step, currentDoc.type]);

  const handleStampUpload = async () => {
    if (!stampFile) return;
    setUploadingStamp(true);
    setError(null);
    try {
      await companyService.uploadStamp(stampFile);
      setStampUploaded(true);
    } catch (err) {
      console.error("Stamp upload failed:", err);
      setError(t("errors.stampUploadFailed"));
    } finally {
      setUploadingStamp(false);
    }
  };

  const handleSendCode = async () => {
    if (!signatoryName.trim()) {
      setError(t("errors.nameRequired"));
      return;
    }
    if (!authConfirmed) {
      setError(t("errors.authRequired"));
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await agreementService.signInitiate({
        agreement_types: ["B2B_AGREEMENT", "DPA"],
        signatory_name: signatoryName.trim(),
        authorized_signatory_confirmed: true,
      });
      setOtpReference(res.otp_reference);
      setSentTo(res.sent_to);
      setCode(["", "", "", "", "", ""]);
      setSecondsLeft(600);
      setResendCooldown(60);
      setResendsRemaining(5);
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.error || t("errors.sendCodeFailed"));
    } finally {
      setSending(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    try {
      const res = await agreementService.resendCode({ otp_reference: otpReference });
      setSentTo(res.sent_to);
      setCode(["", "", "", "", "", ""]);
      setSecondsLeft(600);
      setResendCooldown(60);
      if (typeof res.resends_remaining === "number") setResendsRemaining(res.resends_remaining);
      codeRefs.current[0]?.focus();
    } catch (err: any) {
      const data = err?.response?.data;
      setError(data?.error || err?.error || t("errors.resendFailed"));
      if (data?.locked) {
        setStep("review");
        setAuthConfirmed(false);
      }
    } finally {
      setResending(false);
    }
  };

  const handleCodeChange = (index: number, value: string) => {
    if (value.length > 1 || !/^\d*$/.test(value)) return;
    const next = [...code];
    next[index] = value;
    setCode(next);
    if (value && index < 5) codeRefs.current[index + 1]?.focus();
  };

  const handleCodeKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      codeRefs.current[index - 1]?.focus();
    }
  };

  const handleConfirm = async () => {
    const fullCode = code.join("");
    if (fullCode.length !== 6) {
      setError(t("errors.codeIncomplete"));
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const signed = await agreementService.signConfirm({ otp_reference: otpReference, code: fullCode });
      setSignedDocs(signed);
      setStep("done");
    } catch (err: any) {
      const data = err?.response?.data;
      const message = data?.error || err?.error || t("errors.incorrectCode");
      if (data?.locked) {
        setError(t("errors.restartingReview", { message }));
        setStep("review");
        setAuthConfirmed(false);
        setCode(["", "", "", "", "", ""]);
      } else {
        setError(message);
      }
    } finally {
      setConfirming(false);
    }
  };

  if (step === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (step === "already-signed") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t("alreadySigned.title")}</h1>
          <p className="text-gray-600 mb-6">{t("alreadySigned.message")}</p>
          <button
            onClick={() => router.push(`/${locale}/dashboard/business`)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg"
          >
            {t("alreadySigned.continueButton")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">
          <CheckCircle2 className="w-14 h-14 text-green-600 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t("done.title")}</h1>
          <p className="text-gray-600 mb-6">
            {t("done.message")}
          </p>
          <div className="space-y-2 mb-6 text-left">
            {signedDocs.map((doc) => (
              <a
                key={doc.id}
                href={doc.signed_pdf_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                {t("done.downloadLink", { type: doc.agreement_type_display, id: doc.contract_id })}
              </a>
            ))}
          </div>
          <button
            onClick={() => router.push(`/${locale}/dashboard/business`)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg"
          >
            {t("done.continueButton")}
          </button>
        </div>
      </div>
    );
  }

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
          <ShieldCheck className="w-10 h-10 text-purple-600 mb-4" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">{t("otp.title")}</h1>
          <p className="text-gray-600 text-sm mb-6">
            {t("otp.sentMessage", { email: sentTo })}
          </p>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          <div className="flex gap-2 justify-center mb-4">
            {code.map((digit, i) => (
              <input
                key={i}
                ref={(el) => { codeRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleCodeChange(i, e.target.value)}
                onKeyDown={(e) => handleCodeKeyDown(i, e)}
                className="w-11 h-12 text-center text-lg font-semibold border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            ))}
          </div>

          <p className="text-center text-sm text-gray-500 mb-2">
            {secondsLeft > 0 ? (
              <>{t("otp.codeExpiresIn", { time: formatCountdown(secondsLeft) })}</>
            ) : (
              <span className="text-red-500">{t("otp.codeExpired")}</span>
            )}
          </p>

          <p className="text-center text-sm mb-6">
            {resendCooldown > 0 ? (
              <span className="text-gray-400">{t("otp.resendIn", { seconds: resendCooldown })}</span>
            ) : resendsRemaining <= 0 ? (
              <span className="text-red-500">{t("otp.noResendsLeft")}</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-purple-600 hover:underline font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                {t("otp.resendCode", { count: resendsRemaining })}
              </button>
            )}
          </p>

          <button
            onClick={handleConfirm}
            disabled={confirming || secondsLeft === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("otp.confirmAndSign")}
          </button>
          <button
            onClick={() => setStep("review")}
            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            {t("otp.back")}
          </button>
        </div>
      </div>
    );
  }

  // step === "review"
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{t("review.title")}</h1>
        <p className="text-gray-600 mb-6">
          {t("review.subtitle")}
        </p>

        <div className="flex gap-2 mb-4">
          {DOC_ORDER.map((doc, i) => (
            <button
              key={doc.type}
              onClick={() => setActiveDocIndex(i)}
              className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 ${
                activeDocIndex === i
                  ? "bg-purple-600 text-white"
                  : "bg-white border border-gray-200 text-gray-600"
              }`}
            >
              {scrolledToBottom[doc.type] && <CheckCircle2 className="w-4 h-4" />}
              {doc.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <iframe
            key={currentDoc.type}
            srcDoc={previews[currentDoc.type]}
            className="w-full h-[420px]"
            onLoad={(e) => {
              const win = e.currentTarget.contentWindow;
              win?.addEventListener("scroll", () => handleIframeScroll(currentDoc.type)(e));
            }}
            title={currentDoc.label}
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("review.companyStampLabel")} <span className="text-gray-400 font-normal">{t("review.companyStampHint")}</span>
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept="image/png,image/jpeg"
                onChange={(e) => setStampFile(e.target.files?.[0] ?? null)}
                className="text-sm"
              />
              <button
                onClick={handleStampUpload}
                disabled={!stampFile || uploadingStamp || stampUploaded}
                className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 disabled:opacity-50 rounded-lg flex items-center gap-1.5"
              >
                {uploadingStamp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                {stampUploaded ? t("review.uploadedButton") : t("review.uploadButton")}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t("review.nameLabel")}</label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              placeholder={t("review.namePlaceholder")}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {!allDocsReviewed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
              <p className="text-sm font-medium text-amber-800">
                {t("review.reviewBothPrompt")}
              </p>
              {DOC_ORDER.map((doc, i) => {
                const reviewed = !!scrolledToBottom[doc.type];
                return (
                  <div key={doc.type} className="flex items-center gap-2 text-sm">
                    {reviewed ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                    ) : (
                      <Circle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    <span className={reviewed ? "text-gray-500" : "text-gray-900"}>{doc.label}</span>
                    {!reviewed && (
                      <button
                        type="button"
                        onClick={() => setActiveDocIndex(i)}
                        className="ml-auto text-xs text-purple-600 hover:underline font-medium"
                      >
                        {t("review.reviewNowButton")}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
            <input
              type="checkbox"
              checked={authConfirmed}
              onChange={(e) => setAuthConfirmed(e.target.checked)}
              className="mt-0.5"
            />
            <span>{t("review.authConfirmLabel")}</span>
          </label>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSendCode}
            disabled={sending || !allDocsReviewed || !authConfirmed}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t("review.sendCodeButton")}
          </button>
        </div>
      </div>
    </div>
  );
}
