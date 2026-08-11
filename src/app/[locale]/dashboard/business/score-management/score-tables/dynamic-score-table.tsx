"use client";

import { useState } from "react";
import { Check, Download, Eye, Share2 } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";
import reportService from "@/app/api/reports/endpoints";

interface DynamicScoreTableProps {
  candidates: Candidate[];
  scores: Record<string, CandidateScoreSummary>;
  onViewScores: (candidate: Candidate) => void;
}

// The certificate PDF is served from a public, unauthenticated URL (no API
// wrapper needed) - fetched as a blob and force-downloaded the same way
// reportService.downloadPdf() already does for reports, rather than relying
// on a plain <a download> (browsers routinely ignore that attribute for
// cross-origin URLs like this one, since the PDF lives on api.meritlense.com
// while the dashboard is on meritlense.com).
async function downloadFromUrl(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(downloadUrl);
}

// Share prefers the native share sheet where available (mobile Safari/
// Chrome) and falls back to copying the link, since the PDF is already
// served from a public, unauthenticated URL - nothing extra to generate for
// a "share" action.
function ArtifactActions({
  url,
  candidateName,
  artifactLabel,
  onDownload,
}: {
  url: string;
  candidateName: string;
  artifactLabel: string;
  onDownload?: () => Promise<void>;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (!onDownload) {
      return;
    }
    setDownloading(true);
    try {
      await onDownload();
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: `${candidateName}'s ${artifactLabel}`, url });
      } catch {
        // Cancelled by the user - not an error.
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable (e.g. insecure context) - nothing more to do.
    }
  };

  return (
    <div className="flex items-center gap-3">
      {onDownload ? (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 disabled:opacity-50 font-medium"
          title={`Download ${artifactLabel}`}
        >
          <Download className="w-4 h-4" />
          {downloading ? "Downloading..." : "Download"}
        </button>
      ) : (
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
          title={`Download ${artifactLabel}`}
        >
          <Download className="w-4 h-4" />
          Download
        </a>
      )}
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1 text-gray-500 hover:text-purple-600"
        title={`Share ${artifactLabel} link`}
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
        {copied && <span className="text-green-600 text-xs">Copied!</span>}
      </button>
    </div>
  );
}

// Replaces the old per-job-role table components (driver-table.tsx,
// housekeeper-table.tsx, ...), which each hardcoded a fixed set of column
// keys (SAFE_DRIVING, CLEANING, ...) that never matched any real
// ScoringRule.competency_code. Columns here are built from whatever
// competencies actually exist in the real scoring data for the candidates
// being shown, so this works for any role/rule set without a per-role
// mapping to maintain.
export function DynamicScoreTable({ candidates, scores, onViewScores }: DynamicScoreTableProps) {
  const columns: { code: string; name: string }[] = [];
  const seen = new Set<string>();
  for (const candidate of candidates) {
    const summary = scores[candidate.id];
    if (!summary) continue;
    for (const competency of summary.competencies) {
      if (!seen.has(competency.code)) {
        seen.add(competency.code);
        columns.push({ code: competency.code, name: competency.name });
      }
    }
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Name</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Email</th>
            {columns.map((column) => (
              <th key={column.code} className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">
                {column.name}
              </th>
            ))}
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Avg</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Transcript Report</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Certificate</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">Actions</th>
          </tr>
        </thead>
        <tbody>
          {candidates.map((candidate) => {
            const summary = scores[candidate.id];
            const byCode = new Map(summary?.competencies.map((c) => [c.code, c.percentage]) ?? []);

            // Clicking Download in either column downloads whatever
            // artifacts exist for this candidate together, rather than just
            // the one under that column.
            const downloadAllArtifacts = async () => {
              const tasks: Promise<void>[] = [];
              if (summary?.report?.pdf_url) {
                tasks.push(reportService.downloadPdf(summary.report.report_id, `${summary.report.report_number}.pdf`));
              }
              if (summary?.certificate) {
                tasks.push(downloadFromUrl(summary.certificate.pdf_url, `${summary.certificate.certificate_id}.pdf`));
              }
              await Promise.all(tasks);
            };

            return (
              <tr key={candidate.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 sm:px-6 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm">
                      {candidate.first_name.charAt(0)}{candidate.last_name.charAt(0)}
                    </div>
                    <span className="font-medium text-gray-900">{candidate.full_name}</span>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 text-gray-600">{candidate.email}</td>
                {columns.map((column) => (
                  <td key={column.code} className="px-4 sm:px-6 py-3 text-gray-600">
                    {byCode.has(column.code) ? `${byCode.get(column.code)}%` : "-"}
                  </td>
                ))}
                <td className="px-4 sm:px-6 py-3 font-medium text-purple-600">
                  {summary ? `${summary.overall_percentage}%` : "-"}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  {summary?.report?.pdf_url ? (
                    <>
                      <ArtifactActions
                        url={summary.report.pdf_url}
                        candidateName={candidate.full_name}
                        artifactLabel="MeritLense Transcript Report"
                        onDownload={downloadAllArtifacts}
                      />
                      {summary.evaluation_tier === "SCREENING" && (
                        <p className="text-[11px] text-amber-600 mt-1 max-w-[160px]">
                          Screening Evaluation — identity verification and basic screening only, no Readiness Indicator, Overall Score, or certificate.
                        </p>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400">Not available</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  {summary?.certificate ? (
                    <ArtifactActions
                      url={summary.certificate.pdf_url}
                      candidateName={candidate.full_name}
                      artifactLabel="MeritLense Certificate"
                      onDownload={downloadAllArtifacts}
                    />
                  ) : (
                    <span className="text-gray-400">Not available</span>
                  )}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <button
                    onClick={() => onViewScores(candidate)}
                    className="p-1 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50"
                    title="View Scores"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
