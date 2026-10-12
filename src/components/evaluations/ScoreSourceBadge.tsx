"use client";

import { UserCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CandidateScoreSummary } from "@/app/api/evaluations/types";

// Scheduled interviews are scored by a person (evaluator rating), AI
// interviews by the scoring engine. Both appear in the same score lists, so
// evaluator-rated results carry this badge to keep the two apart. AI
// results stay unbadged - they are the default everywhere else.
export function ScoreSourceBadge({ evaluation }: { evaluation: CandidateScoreSummary | null | undefined }) {
  const t = useTranslations("shared.scoreSource");
  if (evaluation?.source !== "EVALUATOR_RATING") return null;
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800"
      title={t("evaluatorRatingHint")}
    >
      <UserCheck className="h-3 w-3" aria-hidden="true" />
      {t("evaluatorRating")}
    </span>
  );
}
