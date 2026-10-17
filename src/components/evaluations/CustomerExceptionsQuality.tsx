"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, CheckCircle2, Clock3, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { EvaluationListItem } from "@/app/api/evaluations/types";

type AssessmentFilter = "ALL" | "AI_INTERVIEW" | "SCHEDULED_INTERVIEW";
type TranslationNamespace = "dashboard.business.exceptionsQuality" | "dashboard.indivisual.exceptionsQuality";

export function CustomerExceptionsQuality({ namespace }: { namespace: TranslationNamespace }) {
  const t = useTranslations(namespace);
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [filter, setFilter] = useState<AssessmentFilter>("ALL");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      setItems(await evaluationService.getEvaluations());
    } catch {
      setItems([]);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const visibleItems = useMemo(
    () => {
      const interviewAssessments = items.filter((item) => item.evaluation_type === "INTERVIEW");
      return filter === "ALL"
        ? interviewAssessments
        : interviewAssessments.filter((item) => item.assessment_mode === filter);
    },
    [filter, items],
  );

  const processingState = (item: EvaluationListItem) => {
    if (item.review_status === "REQUIRED") return "UNDER_REVIEW";
    if (item.status === "COMPLETED") return "PROCESSED";
    if (item.status === "CANCELLED") return "CANCELLED";
    return "IN_PROGRESS";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900">{t("title")}</h1>
        <p className="mt-1 max-w-3xl text-sm text-gray-600">{t("subtitle")}</p>
      </header>

      <div className="flex flex-col gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-blue-900">{t("automaticProcessing")}</p>
        <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span>{t("filterLabel")}</span>
          <select
            value={filter}
            onChange={(event) => setFilter(event.target.value as AssessmentFilter)}
            className="rounded-md border border-gray-300 bg-white px-3 py-2"
          >
            <option value="ALL">{t("filters.ALL")}</option>
            <option value="AI_INTERVIEW">{t("filters.AI_INTERVIEW")}</option>
            <option value="SCHEDULED_INTERVIEW">{t("filters.SCHEDULED_INTERVIEW")}</option>
          </select>
        </label>
      </div>

      <Card className="overflow-hidden border-0 bg-white shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12" role="status">
            <Loader2 className="h-7 w-7 animate-spin text-purple-600" />
          </div>
        ) : error ? (
          <div className="px-4 py-12 text-center text-sm text-red-700">{t("loadFailed")}</div>
        ) : visibleItems.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-green-500" />
            <p className="font-medium text-gray-900">{t("empty")}</p>
            <p className="mt-1 text-sm text-gray-600">{t("emptyDescription")}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-start text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3 font-medium">{t("table.candidate")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.type")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.date")}</th>
                  <th className="px-4 py-3 font-medium">{t("table.status")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visibleItems.map((item) => {
                  const state = processingState(item);
                  const StateIcon = state === "UNDER_REVIEW" ? AlertCircle : state === "PROCESSED" ? CheckCircle2 : Clock3;
                  const tone = state === "UNDER_REVIEW"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : state === "PROCESSED"
                      ? "border-green-200 bg-green-50 text-green-800"
                      : "border-gray-200 bg-gray-50 text-gray-700";
                  const date = item.scheduled_date ? new Date(item.scheduled_date) : null;
                  return (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-medium text-gray-900">{item.candidate_name}</td>
                      <td className="px-4 py-3 text-gray-700">{t(`filters.${item.assessment_mode}`)}</td>
                      <td className="px-4 py-3 text-gray-700">
                        {date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString() : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className={`inline-flex items-center gap-1.5 ${tone}`}>
                          <StateIcon className="h-3.5 w-3.5" />
                          {t(`states.${state}`)}
                        </Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
