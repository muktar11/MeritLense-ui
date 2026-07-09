"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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
  const contractId = searchParams.get("id") ?? "";

  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState<AgreementVerification | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!contractId) {
      setError("No agreement ID provided.");
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
          setError(err?.response?.data?.error || "No signed agreement found for this ID.");
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-lg w-full">
        <div className="flex items-center gap-2 mb-6">
          <ShieldCheck className="w-6 h-6 text-purple-600" />
          <span className="text-lg font-bold text-gray-900">
            Merit<span className="text-purple-600">Lense</span> Document Verification
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
              This document could not be verified. If you believe this is an error, contact the
              issuing organization.
            </p>
          </div>
        )}

        {!loading && result && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              {result.status === "VALID" ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <span className="text-green-700 font-semibold">Valid Document</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-500" />
                  <span className="text-amber-700 font-semibold">Superseded — a newer version was signed</span>
                </>
              )}
            </div>

            <dl className="space-y-3 text-sm">
              <Row label="Agreement ID" value={result.contract_id} mono />
              <Row label="Type" value={result.agreement_type_display} />
              <Row label="Version" value={result.version} />
              <Row label="Signatory" value={result.signatory_name} />
              <Row
                label="Signed at"
                value={result.signed_at ? new Date(result.signed_at).toUTCString() : "—"}
              />
              <Row label="SHA-256 Hash" value={result.pdf_hash || "—"} mono wrap />
            </dl>

            <p className="text-xs text-gray-400 mt-6">
              To verify integrity, compare the hash above against the SHA-256 checksum of your
              downloaded PDF copy. No evaluation data or personal contact information is shown on
              this page.
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
