"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Check, Download, Share2 } from "lucide-react";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";
import reportService from "@/app/api/reports/endpoints";

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
// a "share" action. Shared between the score tables (dynamic-score-table.tsx,
// B2B and B2C) and ScoreViewModal (same two dashboards) - all four read the
// same "dashboard.business.score-management.table" translation namespace.
export function ArtifactActions({
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

// Transcript + certificate rows for one specific evaluation.
function EvaluationDocumentsRow({
  evaluation,
  candidateName,
  label,
}: {
  evaluation: CandidateScoreSummary;
  candidateName: string;
  label: string;
}) {
  const t = useTranslations("dashboard.business.score-management.table");

  const downloadReport = async () => {
    if (!evaluation.report?.pdf_url) return;
    await reportService.downloadPdf(evaluation.report.report_id, `${evaluation.report.report_number}.pdf`);
  };

  const downloadCertificate = async () => {
    if (!evaluation.certificate) return;
    await downloadFromUrl(evaluation.certificate.pdf_url, `${evaluation.certificate.certificate_id}.pdf`);
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg">
      <p className="text-xs font-semibold text-gray-600 mb-2">{label}</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <span className="text-xs text-gray-500 mr-1">{t("transcript")}</span>
          <div className="mt-1">
            {evaluation.report?.pdf_url ? (
              <ArtifactActions
                url={evaluation.report.pdf_url}
                candidateName={candidateName}
                artifactLabel={t("transcriptReportLabel")}
                onDownload={downloadReport}
              />
            ) : (
              <span className="text-gray-400">{t("notAvailable")}</span>
            )}
          </div>
          {evaluation.evaluation_tier === "SCREENING" && (
            <p className="text-[11px] text-amber-600 mt-1">{t("screeningNote")}</p>
          )}
        </div>
        <div>
          <span className="text-xs text-gray-500 mr-1">{t("certificate")}</span>
          <div className="mt-1">
            {evaluation.certificate ? (
              <ArtifactActions
                url={evaluation.certificate.pdf_url}
                candidateName={candidateName}
                artifactLabel={t("certificateLabel")}
                onDownload={downloadCertificate}
              />
            ) : (
              <span className="text-gray-400">{t("notAvailable")}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Every evaluation's documents at once, not just the most recent - the
// table row only ever shows the candidate's most-recent evaluation's
// documents, so a candidate with more than one evaluation (a retry, or a
// second role) had no way to reach an older one's documents at all.
// Dropped into ScoreViewModal below its evaluation selector (which still
// controls the score breakdown shown below) - `labelFor` reuses that same
// modal's own "{role} — {date} ({score}%)" formatting so each block reads
// consistently with the selector's option text.
export function EvaluationDocumentsSection({
  evaluations,
  candidateName,
  labelFor,
}: {
  evaluations: CandidateScoreSummary[];
  candidateName: string;
  labelFor: (evaluation: CandidateScoreSummary) => string;
}) {
  const t = useTranslations("dashboard.business.score-management.table");

  if (evaluations.length === 0) return null;

  return (
    <div className="space-y-3 mb-6">
      <h3 className="font-medium text-gray-700 flex items-center gap-2">
        <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
        {t("documentsHeading")}
      </h3>
      <div className="space-y-3">
        {evaluations.map((evaluation, index) => (
          <EvaluationDocumentsRow
            key={evaluation.evaluation_id ?? index}
            evaluation={evaluation}
            candidateName={candidateName}
            label={labelFor(evaluation)}
          />
        ))}
      </div>
    </div>
  );
}
