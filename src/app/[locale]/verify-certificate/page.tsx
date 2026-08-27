"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";

import evaluationService from "@/app/api/evaluations/endpoints";
import type { CertificateVerification } from "@/app/api/evaluations/types";

export default function VerifyCertificatePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
        </div>
      }
    >
      <VerifyCertificateContent />
    </Suspense>
  );
}

function VerifyCertificateContent() {
  const searchParams = useSearchParams();
  const certificateId = searchParams.get("id") ?? "";
  const missingCertificateId = !certificateId;

  const [loading, setLoading] = useState(!missingCertificateId);
  const [result, setResult] = useState<CertificateVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (missingCertificateId) {
      return;
    }

    let active = true;
    evaluationService
      .verifyCertificate(certificateId)
      .then((data) => {
        if (active) setResult(data);
      })
      .catch((err) => {
        if (active) {
          setError(err?.response?.data?.detail || err?.detail || "No certificate could be verified for this ID.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [certificateId, missingCertificateId]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-xl w-full border border-slate-200">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-blue-600" />
          <span className="text-lg font-bold text-slate-900">
            Merit<span className="text-pink-500">Lense</span> Certificate Verification
          </span>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        )}

        {!loading && (error || missingCertificateId) && (
          <div className="text-center py-6">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <p className="text-slate-700 font-medium">{error || "No certificate ID provided."}</p>
            <p className="text-sm text-slate-500 mt-2">
              This certificate could not be verified. If you believe this is an error, contact the issuing organization.
            </p>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {result.status === "VALID" ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-semibold">Valid Certificate</span>
                </>
              ) : result.status === "EXPIRED" ? (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-amber-700 font-semibold">Expired Certificate</span>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-red-500" />
                  <span className="text-red-700 font-semibold">Revoked Certificate</span>
                </>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <Row label="Certificate ID" value={result.certificate_id} mono />
              <Row label="Candidate Name" value={result.candidate_name || "—"} />
              <Row label="Status" value={result.status} />
              <Row label="Issued At" value={result.issued_at ? new Date(result.issued_at).toUTCString() : "—"} />
              <Row label="Expires At" value={result.expires_at ? new Date(result.expires_at).toUTCString() : "—"} />
              <Row label="SHA-256 Hash" value={result.pdf_hash || "—"} mono wrap />
            </dl>

            <p className="text-xs text-slate-400 mt-6">
              This public page confirms authenticity and certificate status only. It does not display assessment details, scoring, or personal evaluation results.
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
