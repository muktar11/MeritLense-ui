"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Eye } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";
import reportService from "@/app/api/reports/endpoints";
import TablePagination from "@/components/ui/table-pagination";
import { ArtifactActions } from "@/components/evaluations/EvaluationDocumentLinks";

const PAGE_SIZE = 10;

interface DynamicScoreTableProps {
  candidates: Candidate[];
  // Every scored evaluation per candidate, most-recent first - the table
  // row itself always reflects the latest one.
  scores: Record<string, CandidateScoreSummary[]>;
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
            const evaluations = scores[candidate.id];
            const summary = evaluations?.[0];

            const downloadReport = async () => {
              if (!summary?.report?.pdf_url) return;
              await reportService.downloadPdf(summary.report.report_id, `${summary.report.report_number}.pdf`);
            };
            const downloadCertificate = async () => {
              if (!summary?.certificate) return;
              await downloadFromUrl(summary.certificate.pdf_url, `${summary.certificate.certificate_id}.pdf`);
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
                  {summary?.evaluation_id ? (
                    <>
                      {summary.overall_percentage}%
                      {(evaluations?.length ?? 0) > 1 && (
                        <span className="ml-1 text-xs font-normal text-gray-400">
                          {t("moreEvaluations", { count: evaluations!.length - 1 })}
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
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
                          onDownload={downloadReport}
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
                          onDownload={downloadCertificate}
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
