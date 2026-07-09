"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { CheckCircle2, Loader2, ShieldCheck, FileText } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { Agreement } from "@/app/api/agreements/types";

type Step = "loading" | "review" | "otp" | "already-signed" | "done";

export default function SignAgreementPage() {
  const router = useRouter();
  const locale = useLocale();

  const [step, setStep] = useState<Step>("loading");
  const [previewHtml, setPreviewHtml] = useState("");
  const [reviewed, setReviewed] = useState(false);

  const [signatoryName, setSignatoryName] = useState("");

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
  const [signedDoc, setSignedDoc] = useState<Agreement | null>(null);

  const codeRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const status = await agreementService.getStatus();
        const signed = status.some((a) => a.agreement_type === "B2C_AGREEMENT" && a.status === "SIGNED");
        if (!active) return;

        if (signed) {
          setStep("already-signed");
          return;
        }

        const preview = await agreementService.getPreview("B2C_AGREEMENT");
        if (!active) return;
        setPreviewHtml(preview.html);
        setStep("review");
      } catch (err) {
        console.error("Failed to load agreement:", err);
        if (active) setError("Failed to load your agreement. Please refresh the page.");
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

  // Fallback: some iframe/print-CSS documents don't fire scroll reliably —
  // also mark reviewed once the user has spent a few seconds on the doc.
  useEffect(() => {
    if (step !== "review") return;
    const timer = setTimeout(() => setReviewed(true), 6000);
    return () => clearTimeout(timer);
  }, [step]);

  const handleIframeScroll = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const win = e.currentTarget.contentWindow;
    if (!win) return;
    const doc = win.document;
    const atBottom = doc.documentElement.scrollHeight - win.scrollY - win.innerHeight < 40;
    if (atBottom) setReviewed(true);
  };

  const formatCountdown = (total: number) => {
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const handleSendCode = async () => {
    if (!signatoryName.trim()) {
      setError("Please enter your full legal name.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await agreementService.signInitiate({
        agreement_types: ["B2C_AGREEMENT"],
        signatory_name: signatoryName.trim(),
      });
      setOtpReference(res.otp_reference);
      setSentTo(res.sent_to);
      setCode(["", "", "", "", "", ""]);
      setSecondsLeft(600);
      setResendCooldown(60);
      setResendsRemaining(5);
      setStep("otp");
    } catch (err: any) {
      setError(err?.response?.data?.error || err?.error || "Failed to send the verification code.");
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
      setError(data?.error || err?.error || "Failed to resend the code.");
      if (data?.locked) {
        setStep("review");
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
      setError("Please enter the full 6-digit code.");
      return;
    }
    setConfirming(true);
    setError(null);
    try {
      const signed = await agreementService.signConfirm({ otp_reference: otpReference, code: fullCode });
      setSignedDoc(signed[0] ?? null);
      setStep("done");
    } catch (err: any) {
      const data = err?.response?.data;
      const message = data?.error || err?.error || "Incorrect or expired code.";
      if (data?.locked) {
        setError(`${message} Restarting from document review.`);
        setStep("review");
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Your agreement is signed</h1>
          <p className="text-gray-600 mb-6">You already have a valid B2C Agreement on file.</p>
          <button
            onClick={() => router.push(`/${locale}/dashboard/indivisual`)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg"
          >
            Continue to Dashboard
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Agreement signed</h1>
          <p className="text-gray-600 mb-6">
            Your B2C Agreement has been signed and is on file. A copy has been recorded with a
            full audit trail.
          </p>
          {signedDoc && (
            <div className="space-y-2 mb-6 text-left">
              <a
                href={signedDoc.signed_pdf_url ?? "#"}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-purple-700 hover:underline"
              >
                <FileText className="w-4 h-4" />
                Download {signedDoc.agreement_type_display} ({signedDoc.contract_id})
              </a>
            </div>
          )}
          <button
            onClick={() => router.push(`/${locale}/dashboard/indivisual`)}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2.5 rounded-lg"
          >
            Continue to Dashboard
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
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enter verification code</h1>
          <p className="text-gray-600 text-sm mb-6">
            We sent a 6-digit code by email to {sentTo}. It confirms your signature on the B2C
            Agreement.
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
              <>Code expires in {formatCountdown(secondsLeft)}</>
            ) : (
              <span className="text-red-500">Code expired — request a new one below.</span>
            )}
          </p>

          <p className="text-center text-sm mb-6">
            {resendCooldown > 0 ? (
              <span className="text-gray-400">Resend available in {resendCooldown}s</span>
            ) : resendsRemaining <= 0 ? (
              <span className="text-red-500">No resends left — go back and restart.</span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-purple-600 hover:underline font-medium disabled:opacity-50 inline-flex items-center gap-1.5"
              >
                {resending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Resend code ({resendsRemaining} left)
              </button>
            )}
          </p>

          <button
            onClick={handleConfirm}
            disabled={confirming || secondsLeft === 0}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {confirming ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Confirm & Sign
          </button>
          <button
            onClick={() => setStep("review")}
            className="w-full mt-2 text-sm text-gray-500 hover:text-gray-700 py-2"
          >
            ← Back
          </button>
        </div>
      </div>
    );
  }

  // step === "review"
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Sign Your Agreement</h1>
        <p className="text-gray-600 mb-6">
          Review and sign the B2C Agreement to activate your MeritLense dashboard.
        </p>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <iframe
            srcDoc={previewHtml}
            className="w-full h-[420px]"
            onLoad={(e) => {
              const win = e.currentTarget.contentWindow;
              win?.addEventListener("scroll", () => handleIframeScroll(e));
            }}
            title="B2C Agreement"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your full legal name</label>
            <input
              type="text"
              value={signatoryName}
              onChange={(e) => setSignatoryName(e.target.value)}
              placeholder="As it should appear on the signed document"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {!reviewed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-sm text-amber-800">
              Please scroll through the document above before signing.
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleSendCode}
            disabled={sending || !reviewed}
            className="w-full bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-2.5 rounded-lg flex items-center justify-center gap-2"
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Send Verification Code
          </button>
        </div>
      </div>
    </div>
  );
}
