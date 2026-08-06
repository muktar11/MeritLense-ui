"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const reportId = searchParams.get("id") ?? "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<ReportVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reportId) {
      setError("No report ID provided.");
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
          setError(err?.response?.data?.detail || err?.detail || "No report could be verified for this ID.");
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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900">
            Merit<span className="text-pink-500">Lense</span> Report Verification
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
              This report could not be verified. If you believe this is an error, contact the issuing organization.
            </p>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {result.verification_status === "Authentic" ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-semibold">Authentic Report</span>
                </>
              ) : result.verification_status === "Superseded" ? (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-amber-700 font-semibold">Superseded Report</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 font-semibold">Revoked Report</span>
                </>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <Row label="Report ID" value={result.report_id} mono />
              <Row label="Target Role" value={result.target_role || "—"} />
              <Row label="Assessment Date" value={result.assessment_date || "—"} />
              <Row label="Authenticity Status" value={result.verification_status} />
              <Row label="Public Report Status" value={result.public_report_status || "—"} />
              <Row
                label="Verified At"
                value={result.verification_timestamp ? new Date(result.verification_timestamp).toUTCString() : "—"}
              />
              <Row label="SHA-256 Hash" value={result.sha256_hash || "—"} mono wrap />
            </dl>

            <p className="text-xs text-slate-400 mt-6">
              This public page confirms authenticity only. It does not display candidate score details, readiness reasoning, employer data, or personal evaluation results.
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
