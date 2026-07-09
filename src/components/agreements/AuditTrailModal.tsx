"use client";

import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import agreementService from "@/app/api/agreements/endpoints";
import type { AuditLogEntry } from "@/app/api/agreements/types";

interface AuditTrailModalProps {
  agreementId: string | null;
  agreementLabel: string;
  onClose: () => void;
}

export function AuditTrailModal({ agreementId, agreementLabel, onClose }: AuditTrailModalProps) {
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!agreementId) return;
    setLoading(true);
    setError(null);
    agreementService
      .getAuditTrail(agreementId)
      .then(setEntries)
      .catch(() => setError("Failed to load the audit trail."))
      .finally(() => setLoading(false));
  }, [agreementId]);

  if (!agreementId) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="fixed inset-0 bg-black/50 pointer-events-auto" onClick={onClose} />

      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg pointer-events-auto relative max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4 sticky top-0 bg-white z-10">
            <h3 className="text-lg font-bold text-gray-900">Audit Trail — {agreementLabel}</h3>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>

          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            </div>
          )}

          {!loading && error && <p className="text-sm text-red-600">{error}</p>}

          {!loading && !error && entries.length === 0 && (
            <p className="text-sm text-gray-500">No audit events recorded yet.</p>
          )}

          {!loading && !error && entries.length > 0 && (
            <ul className="space-y-3">
              {entries.map((entry) => (
                <li key={entry.id} className="border-b border-gray-100 pb-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">{entry.action_display}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-gray-600 mt-0.5">{entry.description}</p>
                  {entry.ip_address && (
                    <p className="text-xs text-gray-400 mt-0.5">IP: {entry.ip_address}</p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
