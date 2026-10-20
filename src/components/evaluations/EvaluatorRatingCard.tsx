"use client";

import { useEffect, useState } from "react";
import { Loader2, Star } from "lucide-react";
import { useTranslations } from "next-intl";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { EvaluatorRating, EvaluatorRatingPayload } from "@/app/api/evaluations/types";
import { ScheduledEvaluationOutputs } from "./ScheduledEvaluationOutputs";

// The 5 approved report dimensions. behavior_integrity is still entered as
// a raw 0-100 score here (that's the evaluator's actual input) - it's only
// shown as a Risk Level (High/Medium/Low) on the certificate/report, per
// Report Specification Section 4. psych_professional is no longer
// collected - it isn't an approved dimension and is pending legal review.
type RatingFormKey = Exclude<keyof EvaluatorRatingPayload, "critical_safety_failure" | "critical_safety_failure_note">;
type EvaluatorRatingScoreKey = Exclude<RatingFormKey, "comments">;

const RATING_POOLS: { key: EvaluatorRatingScoreKey }[] = [
  { key: "safety_awareness" },
  { key: "hygiene" },
  { key: "communication" },
  { key: "task_execution" },
  { key: "behavior_integrity" },
];

const EMPTY_RATING_FORM: Record<RatingFormKey, string> = {
  safety_awareness: "",
  hygiene: "",
  communication: "",
  behavior_integrity: "",
  task_execution: "",
  comments: "",
};

interface EvaluatorRatingCardProps {
  evaluationId: string;
  className?: string;
}

// Self-contained: fetches and submits its own rating given only an
// evaluationId, so it can be dropped anywhere an evaluator should be able
// to rate a candidate - the "View AI Results" modal, and the live-call
// "Call ended" screen - without duplicating this state/logic in each spot.
export function EvaluatorRatingCard({ evaluationId, className }: EvaluatorRatingCardProps) {
  const t = useTranslations("shared.evaluatorRatingCard");
  const [loading, setLoading] = useState(true);
  const [evaluatorRating, setEvaluatorRating] = useState<EvaluatorRating | null>(null);
  const [ratingForm, setRatingForm] = useState(EMPTY_RATING_FORM);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);
  const [criticalSafetyFailure, setCriticalSafetyFailure] = useState(false);
  const [criticalSafetyFailureNote, setCriticalSafetyFailureNote] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    evaluationService.getEvaluatorRating(evaluationId).then((ratingData) => {
      if (cancelled) return;
      setEvaluatorRating(ratingData);
      setRatingForm(
        ratingData
          ? {
              safety_awareness: String(ratingData.safety_awareness),
              hygiene: ratingData.hygiene !== null ? String(ratingData.hygiene) : "",
              communication: ratingData.communication !== null ? String(ratingData.communication) : "",
              behavior_integrity: String(ratingData.behavior_integrity),
              task_execution: String(ratingData.task_execution),
              comments: ratingData.comments ?? "",
            }
          : EMPTY_RATING_FORM
      );
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setRatingError(t("submitFailedError")); setLoading(false); }
    });
    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  const handleRatingFieldChange = (key: RatingFormKey, value: string) => {
    setRatingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitRating = async () => {
    const parsed: Partial<EvaluatorRatingPayload> = {};
    for (const { key } of RATING_POOLS) {
      const numeric = Number(ratingForm[key]);
      if (ratingForm[key].trim() === "" || Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
        setRatingError(t("scoreRangeError"));
        return;
      }
      parsed[key] = numeric;
    }
    parsed.comments = ratingForm.comments;
    if (criticalSafetyFailure && !criticalSafetyFailureNote.trim()) {
      setRatingError(t("criticalSafetyFailureNoteRequired"));
      return;
    }
    parsed.critical_safety_failure = criticalSafetyFailure;
    parsed.critical_safety_failure_note = criticalSafetyFailure ? criticalSafetyFailureNote.trim() : "";

    setSubmittingRating(true);
    setRatingError(null);
    try {
      const saved = await evaluationService.submitEvaluatorRating(evaluationId, parsed as EvaluatorRatingPayload);
      setEvaluatorRating(saved);
    } catch (err) {
      const detail = (err as { detail?: string; response?: { data?: { detail?: string } } })?.detail
        ?? (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setRatingError(detail ?? t("submitFailedError"));
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-white border border-gray-200 rounded-2xl p-6 flex items-center justify-center ${className ?? ""}`}>
        <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 space-y-5 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-600" />
          <h4 className="text-base font-bold text-gray-900">{t("title")}</h4>
        </div>
      </div>

      {ratingError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
          {ratingError}
        </div>
      )}

      {!evaluatorRating ? (
        <div className="space-y-5">
          <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">{t("scoringGuidance")}</p>
          <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            {RATING_POOLS.map(({ key }) => (
              <label key={key} className="block">
                <span className="text-sm font-medium text-gray-700">{t(`pools.${key}`)}</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ratingForm[key]}
                  onChange={(e) => handleRatingFieldChange(key, e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder={t("scorePlaceholder")}
                />
              </label>
            ))}
          </div>
          <label className="block"><span className="text-sm font-medium text-gray-700">{t("comments")}</span>
            <textarea value={ratingForm.comments} onChange={(e) => handleRatingFieldChange("comments", e.target.value)} maxLength={10000}
              className="mt-1.5 w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm" rows={3} /></label>
          <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 space-y-3">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={criticalSafetyFailure}
                onChange={(e) => setCriticalSafetyFailure(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600 focus:ring-red-500"
              />
              <span>
                <span className="block text-sm font-semibold text-red-800">{t("criticalSafetyFailure")}</span>
                <span className="block text-xs text-red-700">{t("criticalSafetyFailureHelp")}</span>
              </span>
            </label>
            {criticalSafetyFailure && (
              <label className="block">
                <span className="text-sm font-medium text-gray-700">{t("criticalSafetyFailureNote")}</span>
                <textarea
                  value={criticalSafetyFailureNote}
                  onChange={(e) => setCriticalSafetyFailureNote(e.target.value)}
                  maxLength={5000}
                  rows={3}
                  className="mt-1.5 w-full rounded-xl border border-red-200 bg-white px-3.5 py-2.5 text-sm"
                />
              </label>
            )}
          </div>
          <p className="text-xs text-gray-500">{t("finalSubmissionLock")}</p>
          <button
            type="button"
            onClick={handleSubmitRating}
            disabled={submittingRating}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-linear-to-r from-teal-400 to-purple-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-semibold shadow-md shadow-purple-200"
          >
            {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            {t("submitButton")}
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-5">
          <p className="sm:col-span-5 rounded-lg bg-purple-50 p-3 text-xs text-purple-900">{t("finalSubmissionLock")}</p>
          <div className="sm:col-span-5 rounded-xl bg-teal-50 p-4"><p className="text-sm">{t("overallOutcome")}</p>
            <p className="text-xl font-bold">{evaluatorRating.overall_score}% · {t(`readiness.${evaluatorRating.readiness_status}` as "readiness.READY")}</p>
          </div>
          {RATING_POOLS.map(({ key }) => (
            <div key={key} className="rounded-xl bg-purple-50/60 border border-purple-100 px-3 py-2.5 text-center">
              <p className="text-xs text-gray-500">{t(`pools.${key}`)}</p>
              <p className="text-lg font-bold text-gray-900">
                {evaluatorRating[key] ?? t("notAvailable")}
                {key === "behavior_integrity" && (
                  <span className="ml-1 text-xs font-medium text-gray-500">
                    {t("riskLabel", { level: t(`riskLevel.${evaluatorRating.behavioral_risk_level}`) })}
                  </span>
                )}
              </p>
            </div>
          ))}
          <div className="rounded-xl bg-purple-50/60 border border-purple-100 px-3 py-2.5 text-center">
            <p className="text-xs text-gray-500">{t("consistency")}</p>
            <p className="text-lg font-bold text-gray-900">{evaluatorRating.consistency}</p>
          </div>
          {evaluatorRating.critical_safety_failure && (
            <div className="sm:col-span-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800">
              <p className="font-semibold">{t("criticalSafetyFailureRecorded")}</p>
              <p className="whitespace-pre-wrap">{evaluatorRating.critical_safety_failure_note}</p>
            </div>
          )}
          {evaluatorRating.rated_by_name && (
            <p className="sm:col-span-5 text-[11px] text-gray-500">
              {t("ratedByOn", { name: evaluatorRating.rated_by_name, date: new Date(evaluatorRating.rated_at).toLocaleString() })}
            </p>
          )}
          {evaluatorRating.comments && <p className="sm:col-span-5 whitespace-pre-wrap text-sm text-gray-700">{t("comments")}: {evaluatorRating.comments}</p>}
          <div className="sm:col-span-5"><ScheduledEvaluationOutputs evaluationId={evaluationId} /></div>
        </div>
      )}
    </div>
  );
}
