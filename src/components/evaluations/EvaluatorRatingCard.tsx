"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil, Star } from "lucide-react";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { EvaluatorRating, EvaluatorRatingPayload } from "@/app/api/evaluations/types";

// The 5 approved report dimensions. behavior_integrity is still entered as
// a raw 0-100 score here (that's the evaluator's actual input) - it's only
// shown as a Risk Level (High/Medium/Low) on the certificate/report, per
// Report Specification Section 4. psych_professional is no longer
// collected - it isn't an approved dimension and is pending legal review.
const RATING_POOLS: { key: keyof EvaluatorRatingPayload; label: string }[] = [
  { key: "safety_awareness", label: "Safety Awareness" },
  { key: "hygiene", label: "Hygiene & Standards" },
  { key: "communication", label: "Communication Ability" },
  { key: "task_execution", label: "Practical Task Execution" },
  { key: "behavior_integrity", label: "Behavioral Indicators" },
];

const EMPTY_RATING_FORM: Record<keyof EvaluatorRatingPayload, string> = {
  safety_awareness: "",
  hygiene: "",
  communication: "",
  behavior_integrity: "",
  task_execution: "",
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
  const [loading, setLoading] = useState(true);
  const [evaluatorRating, setEvaluatorRating] = useState<EvaluatorRating | null>(null);
  const [ratingForm, setRatingForm] = useState(EMPTY_RATING_FORM);
  const [isEditingRating, setIsEditingRating] = useState(false);
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingError, setRatingError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    evaluationService.getEvaluatorRating(evaluationId).then((ratingData) => {
      if (cancelled) return;
      setEvaluatorRating(ratingData);
      setIsEditingRating(!ratingData);
      setRatingForm(
        ratingData
          ? {
              safety_awareness: String(ratingData.safety_awareness),
              hygiene: ratingData.hygiene !== null ? String(ratingData.hygiene) : "",
              communication: ratingData.communication !== null ? String(ratingData.communication) : "",
              behavior_integrity: String(ratingData.behavior_integrity),
              task_execution: String(ratingData.task_execution),
            }
          : EMPTY_RATING_FORM
      );
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  const handleRatingFieldChange = (key: keyof EvaluatorRatingPayload, value: string) => {
    setRatingForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmitRating = async () => {
    const parsed: Partial<EvaluatorRatingPayload> = {};
    for (const { key } of RATING_POOLS) {
      const numeric = Number(ratingForm[key]);
      if (ratingForm[key].trim() === "" || Number.isNaN(numeric) || numeric < 0 || numeric > 100) {
        setRatingError("Enter a value between 0 and 100 for every pool.");
        return;
      }
      parsed[key] = numeric;
    }

    setSubmittingRating(true);
    setRatingError(null);
    try {
      const saved = await evaluationService.submitEvaluatorRating(evaluationId, parsed as EvaluatorRatingPayload);
      setEvaluatorRating(saved);
      setIsEditingRating(false);
    } catch (err) {
      const detail = (err as { detail?: string; response?: { data?: { detail?: string } } })?.detail
        ?? (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setRatingError(detail ?? "Failed to submit rating. Try again.");
    } finally {
      setSubmittingRating(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-center justify-center ${className ?? ""}`}>
        <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
      </div>
    );
  }

  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-3 ${className ?? ""}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-amber-600" />
          <h4 className="text-sm font-semibold text-gray-900">Evaluator Rating</h4>
        </div>
        {evaluatorRating && !isEditingRating && (
          <button
            type="button"
            onClick={() => setIsEditingRating(true)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 border border-amber-300 bg-white hover:bg-amber-50 text-amber-700 rounded-lg text-xs font-medium"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        )}
      </div>

      {ratingError && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-xs">
          {ratingError}
        </div>
      )}

      {!evaluatorRating || isEditingRating ? (
        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {RATING_POOLS.map(({ key, label }) => (
              <label key={key} className="text-xs text-gray-700">
                {label}
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={ratingForm[key]}
                  onChange={(e) => handleRatingFieldChange(key, e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-2.5 py-1.5 text-sm text-gray-900"
                  placeholder="0-100"
                />
              </label>
            ))}
          </div>
          <div className="rounded-lg border border-amber-200 bg-white px-3 py-2">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-gray-700">Consistency</p>
                <p className="mt-0.5 text-xs text-gray-500">Calculated automatically from the candidate&apos;s responses.</p>
              </div>
              {evaluatorRating && (
                <p className="text-lg font-bold text-gray-900">{evaluatorRating.consistency}</p>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleSubmitRating}
            disabled={submittingRating}
            className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium"
          >
            {submittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Star className="w-4 h-4" />}
            Submit Rating
          </button>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-5">
          {RATING_POOLS.map(({ key, label }) => (
            <div key={key} className="rounded-lg bg-white border border-amber-200 px-3 py-2 text-center">
              <p className="text-xs text-gray-500">{label}</p>
              <p className="text-lg font-bold text-gray-900">
                {evaluatorRating[key] ?? "N/A"}
                {key === "behavior_integrity" && (
                  <span className="ml-1 text-xs font-medium text-gray-500">
                    ({evaluatorRating.behavioral_risk_level} risk)
                  </span>
                )}
              </p>
            </div>
          ))}
          <div className="rounded-lg bg-white border border-amber-200 px-3 py-2 text-center">
            <p className="text-xs text-gray-500">Consistency</p>
            <p className="text-lg font-bold text-gray-900">{evaluatorRating.consistency}</p>
          </div>
          {evaluatorRating.rated_by_name && (
            <p className="sm:col-span-5 text-[11px] text-gray-500">
              Rated by {evaluatorRating.rated_by_name} on{" "}
              {new Date(evaluatorRating.rated_at).toLocaleString()}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
