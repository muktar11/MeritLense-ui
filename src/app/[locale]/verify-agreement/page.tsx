"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatUtc } from "@/lib/format-utc";
import { CheckCircle2, AlertTriangle, XCircle, Loader2, ShieldCheck } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { AgreementVerification } from "@/app/api/agreements/types";

export default function VerifyAgreementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      }
    >
      <VerifyAgreementContent />
    </Suspense>
  );
}

function VerifyAgreementContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("shared.verifyPages");
  const locale = useLocale();
  const tTypes = useTranslations("shared.agreementTypes");
  const contractId = searchParams.get("id") ?? "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AgreementVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractId) {
      setError(t("agreement.noId"));
      setLoading(false);
      return;
    }
    let active = true;
    agreementService
      .verifyAgreement(contractId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) {
          setError(t("agreement.notFound"));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [contractId]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
          <span className="text-lg font-bold text-gray-900">
            Merit<span className="text-purple-600">Lense</span> {t("agreement.title")}
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-gray-700 font-medium">{error}</p>
            <p className="text-sm text-gray-500 mt-2">
              {t("agreement.failedHint")}
            </p>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {result.status === "VALID" ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-semibold">{t("agreement.valid")}</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-amber-700 font-semibold">{t("agreement.superseded")}</span>
                </>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <Row label={t("agreement.id")} value={result.contract_id} mono />
              <Row label={t("agreement.type")} value={tTypes.has(result.agreement_type) ? tTypes(result.agreement_type) : result.agreement_type_display} />
              <Row label={t("agreement.version")} value={result.version} />
              <Row label={t("agreement.signatory")} value={result.signatory_name} />
              <Row
                label={t("agreement.signedAt")}
                value={formatUtc(result.signed_at, locale)}
              />
              <Row label={t("hash")} value={result.pdf_hash || "—"} mono wrap />
            </dl>

            <p className="text-xs text-gray-400 mt-6">
              {t("agreement.footer")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, wrap }: { label: string; value: string; mono?: boolean; wrap?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-gray-100 pb-2">
      <dt className="text-gray-500">{label}</dt>
      <dd className={`text-gray-900 font-medium ${mono ? "font-mono text-xs" : ""} ${wrap ? "break-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
