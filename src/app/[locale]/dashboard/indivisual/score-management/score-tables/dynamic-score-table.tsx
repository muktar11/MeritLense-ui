"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Download, Eye, Share2 } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";
import reportService from "@/app/api/reports/endpoints";
import TablePagination from "@/components/ui/table-pagination";

const PAGE_SIZE = 10;

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
  const t = useTranslations("dashboard.business.score-management.table");
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
          title={t("downloadTooltip", { label: artifactLabel })}
        >
          <Download className="w-4 h-4" />
          {downloading ? t("downloading") : t("download")}
        </button>
      ) : (
        <a
          href={url}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-700 font-medium"
          title={t("downloadTooltip", { label: artifactLabel })}
        >
          <Download className="w-4 h-4" />
          {t("download")}
        </a>
      )}
      <button
        type="button"
        onClick={handleShare}
        className="inline-flex items-center gap-1 text-gray-500 hover:text-purple-600"
        title={t("shareTooltip", { label: artifactLabel })}
      >
        {copied ? <Check className="w-4 h-4 text-green-600" /> : <Share2 className="w-4 h-4" />}
        {copied && <span className="text-green-600 text-xs">{t("copied")}</span>}
      </button>
    </div>
  );
}

// Previously rendered one extra column per real competency code (built from
// whatever ScoringRule.competency_code values actually appear in the score
// data, replacing older per-job-role tables that hardcoded a fixed set of
// keys). With enough competencies that made the table wider than any
// reasonable viewport, forcing horizontal scroll. The per-competency
// breakdown is already available in full (with progress bars) via "View
// Scores" -> ScoreViewModal, so the table itself only needs the Avg - it
// never grows past a fixed set of columns regardless of how many
// competencies a role's scoring rules define.
export function DynamicScoreTable({ candidates, scores, onViewScores }: DynamicScoreTableProps) {
  const t = useTranslations("dashboard.business.score-management.table");
  const [currentPage, setCurrentPage] = useState(1);
  const [prevCandidates, setPrevCandidates] = useState(candidates);
  if (candidates !== prevCandidates) {
    setPrevCandidates(candidates);
    setCurrentPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedCandidates = candidates.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div>
      <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{t("headers.candidate")}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{t("headers.avgScore")}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{t("headers.documents")}</th>
            <th className="px-4 sm:px-6 py-2 text-left font-semibold text-gray-700">{t("headers.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {paginatedCandidates.map((candidate) => {
            const summary = scores[candidate.id];

            // Clicking Download on either document downloads whatever
            // artifacts exist for this candidate together, rather than just
            // the one under that document.
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
                    <div className="w-8 h-8 rounded-full bg-linear-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-semibold text-sm shrink-0">
                      {candidate.first_name.charAt(0)}{candidate.last_name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">{candidate.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{candidate.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3 font-medium text-purple-600">
                  {summary ? `${summary.overall_percentage}%` : "-"}
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <div className="space-y-2">
                    <div>
                      <span className="text-xs text-gray-500 mr-1">{t("transcript")}</span>
                      {summary?.report?.pdf_url ? (
                        <ArtifactActions
                          url={summary.report.pdf_url}
                          candidateName={candidate.full_name}
                          artifactLabel={t("transcriptReportLabel")}
                          onDownload={downloadAllArtifacts}
                        />
                      ) : (
                        <span className="text-gray-400">{t("notAvailable")}</span>
                      )}
                      {summary?.evaluation_tier === "SCREENING" && (
                        <p className="text-[11px] text-amber-600 mt-1 max-w-[220px]">
                          {t("screeningNote")}
                        </p>
                      )}
                    </div>
                    <div>
                      <span className="text-xs text-gray-500 mr-1">{t("certificate")}</span>
                      {summary?.certificate ? (
                        <ArtifactActions
                          url={summary.certificate.pdf_url}
                          candidateName={candidate.full_name}
                          artifactLabel={t("certificateLabel")}
                          onDownload={downloadAllArtifacts}
                        />
                      ) : (
                        <span className="text-gray-400">{t("notAvailable")}</span>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 sm:px-6 py-3">
                  <button
                    onClick={() => onViewScores(candidate)}
                    className="p-1 text-gray-400 hover:text-purple-600 rounded-full hover:bg-purple-50"
                    title={t("viewScoresTooltip")}
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

      {candidates.length > 0 && (
        <TablePagination
          currentPage={safePage}
          totalItems={candidates.length}
          pageSize={PAGE_SIZE}
          onPageChange={setCurrentPage}
          itemLabel={t("itemLabelPlural")}
        />
      )}
    </div>
  );
}
