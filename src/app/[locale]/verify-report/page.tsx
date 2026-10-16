"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { formatUtc } from "@/lib/format-utc";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

import reportService from "@/app/api/reports/endpoints";
import type { ReportVerification } from "@/app/api/reports/types";

export default function VerifyReportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <VerifyReportContent />
    </Suspense>
  );
}

function VerifyReportContent() {
  const searchParams = useSearchParams();
  const t = useTranslations("shared.verifyPages");
  const locale = useLocale();
  const reportId = searchParams.get("id") ?? "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReportVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError(t("report.noId"));
      setLoading(false);
      return;
    }

    let active = true;
    reportService
      .verifyReport(reportId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) {
          setError(t("report.notFound"));
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [reportId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4" dir={locale === "ar" ? "rtl" : "ltr"}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900">
            Merit<span className="text-pink-500">Lense</span> {t("report.title")}
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loading && error && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">{error}</p>
            <p className="text-sm text-slate-500 mt-2">
              {t("report.failedHint")}
            </p>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {result.verification_status === "Authentic" ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-semibold">{t("report.authentic")}</span>
                </>
              ) : result.verification_status === "Superseded" ? (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-amber-700 font-semibold">{t("report.superseded")}</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 font-semibold">{t("report.revoked")}</span>
                </>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <Row label={t("report.id")} value={result.report_id} mono />
              <Row label={t("report.targetRole")} value={result.target_role || "—"} />
              <Row label={t("report.assessmentDate")} value={result.assessment_date || "—"} />
              <Row label={t("report.authenticity")} value={t.has(`report.statusValues.${result.verification_status}`) ? t(`report.statusValues.${result.verification_status}`) : result.verification_status} />
              <Row label={t("report.publicStatus")} value={result.public_report_status || "—"} />
              <Row
                label={t("report.verifiedAt")}
                value={formatUtc(result.verification_timestamp, locale)}
              />
              <Row label={t("hash")} value={result.sha256_hash || "—"} mono wrap />
            </dl>

            <p className="text-xs text-slate-400 mt-6">
              {t("report.footer")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, mono, wrap }: { label: string; value: string; mono?: boolean; wrap?: boolean }) {
  return (
    <div className="flex flex-col sm:flex-row sm:justify-between gap-1 border-b border-slate-100 pb-2">
      <dt className="text-slate-500">{label}</dt>
      <dd className={`text-slate-900 font-medium ${mono ? "font-mono text-xs" : ""} ${wrap ? "break-all" : ""}`}>
        {value}
      </dd>
    </div>
  );
}
