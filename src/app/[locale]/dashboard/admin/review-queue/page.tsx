"use client";

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Eye, ClipboardCheck, X, AlertCircle } from "lucide-react";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { PendingReviewItem, ReviewDecision } from "@/app/api/evaluations/types";
import { EvaluationResultsModal } from "@/components/evaluations/EvaluationResultsModal";
import { apiErrorMessage } from "@/lib/api-error-message";

const DECISIONS: ReviewDecision[] = ["READY", "PARTIALLY_READY", "NOT_READY", "INCOMPLETE"];

function roleLabel(roleCode: string): string {
  return roleCode.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

export default function ReviewQueuePage() {
  const t = useTranslations("dashboard.admin.reviewQueue");
  const locale = useLocale();
  const [items, setItems] = useState<PendingReviewItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [notice, setNotice] = useState("");
  const [viewing, setViewing] = useState<PendingReviewItem | null>(null);
  const [reviewing, setReviewing] = useState<PendingReviewItem | null>(null);
  const [assessmentType, setAssessmentType] = useState<"ALL" | "AI_INTERVIEW" | "SCHEDULED_INTERVIEW">("ALL");

  const fetchQueue = useCallback(async () => {
    setLoading(true);
    setLoadError("");
    try {
      setItems(await evaluationService.getPendingReview());
    } catch {
      setLoadError(t("loadFailed"));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchQueue();
  }, [fetchQueue]);

  const outcomeLabel = (value: string) =>
    (DECISIONS as string[]).includes(value) ? t(`decisions.${value}`) : value.replace(/_/g, " ");
  const tierLabel = (value: string) => (value === "FULL" || value === "SCREENING" ? t(`tiers.${value}`) : value);
  const completedLabel = (value: string | null) =>
    value ? format(new Date(value), "d MMM yyyy, HH:mm", locale === "ar" ? { locale: ar } : undefined) : "—";
  const filteredItems = assessmentType === "ALL"
    ? items
    : items.filter((item) => item.assessment_type === assessmentType);

  const reasonsList = (reasons: string[]) => (
    <ul className="space-y-1">
      {reasons.map((reason) => (
        <li key={reason} className="flex items-start gap-1.5 text-xs text-gray-700">
          <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
          <span>{reason}</span>
        </li>
      ))}
    </ul>
  );

  const actions = (item: PendingReviewItem, block = false) => (
    <div className={`flex gap-2 ${block ? "flex-col sm:flex-row" : ""}`}>
      <Button size="sm" variant="outline" onClick={() => setViewing(item)} className={block ? "w-full sm:w-auto" : ""}>
        <Eye className="w-4 h-4 me-1" />
        {t("viewResults")}
      </Button>
      <Button
        size="sm"
        onClick={() => setReviewing(item)}
        className={`bg-purple-600 hover:bg-purple-700 text-white ${block ? "w-full sm:w-auto" : ""}`}
      >
        <ClipboardCheck className="w-4 h-4 me-1" />
        {t("review")}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{t("title")}</h1>
          <p className="text-sm text-gray-600 max-w-3xl">{t("subtitle")}</p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-lg border border-blue-100 bg-blue-50 px-4 py-3">
          <p className="text-sm text-blue-900">{t("automaticProcessing")}</p>
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <span>{t("filterLabel")}</span>
            <select
              value={assessmentType}
              onChange={(event) => setAssessmentType(event.target.value as typeof assessmentType)}
              className="rounded-md border border-gray-300 bg-white px-3 py-2"
            >
              <option value="ALL">{t("filters.ALL")}</option>
              <option value="AI_INTERVIEW">{t("filters.AI_INTERVIEW")}</option>
              <option value="SCHEDULED_INTERVIEW">{t("filters.SCHEDULED_INTERVIEW")}</option>
            </select>
          </label>
        </div>

        {notice && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label={t("modal.cancel")}>
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <Card className="bg-white shadow-sm border-0">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : loadError ? (
            <div className="text-center py-12 text-red-600 text-sm">{loadError}</div>
          ) : filteredItems.length === 0 ? (
            <div className="text-center py-12">
              <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">{items.length === 0 ? t("empty") : t("emptyFiltered")}</p>
            </div>
          ) : (
            <>
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead>{t("table.candidate")}</TableHead>
                      <TableHead>{t("table.assessmentType")}</TableHead>
                      <TableHead>{t("table.role")}</TableHead>
                      <TableHead>{t("table.automatic")}</TableHead>
                      <TableHead>{t("table.reasons")}</TableHead>
                      <TableHead>{t("table.completed")}</TableHead>
                      <TableHead>{t("table.actions")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredItems.map((item) => (
                      <TableRow key={item.evaluation_id} className="align-top hover:bg-gray-50">
                        <TableCell>
                          <p className="font-medium text-gray-900">{item.candidate_name}</p>
                          <p className="text-xs text-gray-500">{item.company ?? t("noCompany")}</p>
                        </TableCell>
                        <TableCell className="text-sm text-gray-700">{t(`filters.${item.assessment_type}`)}</TableCell>
                        <TableCell className="text-sm text-gray-700">
                          <p>{roleLabel(item.role_code)}</p>
                          <p className="text-xs text-gray-500">{tierLabel(item.evaluation_tier)} · {item.language}</p>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{outcomeLabel(item.automatic_readiness)}</Badge>
                          {item.score !== null && <p className="text-xs text-gray-500 mt-1">{item.score}%</p>}
                        </TableCell>
                        <TableCell className="max-w-sm">{reasonsList(item.review_reasons)}</TableCell>
                        <TableCell className="text-sm text-gray-600 whitespace-nowrap">{completedLabel(item.completed_at)}</TableCell>
                        <TableCell>{actions(item)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="lg:hidden divide-y divide-gray-100">
                {filteredItems.map((item) => (
                  <div key={item.evaluation_id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{item.candidate_name}</p>
                        <p className="text-xs text-gray-500 truncate">
                          {t(`filters.${item.assessment_type}`)} · {roleLabel(item.role_code)} · {tierLabel(item.evaluation_tier)} · {item.language}
                        </p>
                        <p className="text-xs text-gray-500 truncate">{item.company ?? t("noCompany")}</p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{outcomeLabel(item.automatic_readiness)}</Badge>
                    </div>
                    {reasonsList(item.review_reasons)}
                    <p className="text-xs text-gray-500">{completedLabel(item.completed_at)}</p>
                    {actions(item, true)}
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <EvaluationResultsModal
        evaluationId={viewing?.evaluation_id ?? null}
        candidateName={viewing?.candidate_name ?? ""}
        onClose={() => setViewing(null)}
      />

      {reviewing && (
        <ReviewDecisionModal
          item={reviewing}
          outcomeLabel={outcomeLabel}
          reasons={reasonsList(reviewing.review_reasons)}
          onClose={() => setReviewing(null)}
          onReleased={async () => {
            setReviewing(null);
            setNotice(t("released"));
            await fetchQueue();
          }}
        />
      )}
    </div>
  );
}

function ReviewDecisionModal({
  item,
  outcomeLabel,
  reasons,
  onClose,
  onReleased,
}: {
  item: PendingReviewItem;
  outcomeLabel: (value: string) => string;
  reasons: React.ReactNode;
  onClose: () => void;
  onReleased: () => Promise<void>;
}) {
  const t = useTranslations("dashboard.admin.reviewQueue");
  const initial = (DECISIONS as string[]).includes(item.automatic_readiness)
    ? (item.automatic_readiness as ReviewDecision)
    : "NOT_READY";
  const [decision, setDecision] = useState<ReviewDecision>(initial);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError(t("modal.notesRequired"));
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await evaluationService.submitHumanReview(item.evaluation_id, { decision, notes: notes.trim() });
      await onReleased();
    } catch (err) {
      setError(apiErrorMessage(err) || t("modal.failed"));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4">
      <div className="fixed inset-0 bg-black/50" onClick={submitting ? undefined : onClose} />
      <form
        onSubmit={submit}
        className="relative bg-white w-full h-full sm:h-auto sm:max-w-lg sm:rounded-2xl shadow-xl flex flex-col sm:max-h-[90vh]"
      >
        <div className="flex items-start justify-between gap-4 px-5 pt-5 pb-4 border-b border-gray-200">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-gray-900">{t("modal.title")}</h2>
            <p className="text-sm text-gray-500 truncate">{item.candidate_name}</p>
          </div>
          <button type="button" onClick={onClose} disabled={submitting} aria-label={t("modal.cancel")}
            className="text-gray-500 hover:text-gray-800 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500">{t("modal.automatic")}</p>
              <p className="font-semibold text-gray-900">
                {outcomeLabel(item.automatic_readiness)}
                {item.score !== null && <span className="font-normal text-gray-500"> · {item.score}%</span>}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">{t("modal.reasons")}</p>
            {reasons}
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-gray-700 mb-2">{t("modal.decision")}</legend>
            <div className="grid grid-cols-2 gap-2">
              {DECISIONS.map((value) => (
                <label
                  key={value}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm cursor-pointer ${
                    decision === value ? "border-purple-500 bg-purple-50 text-purple-900" : "border-gray-300 text-gray-700"
                  }`}
                >
                  <input type="radio" name="decision" value={value} checked={decision === value}
                    onChange={() => setDecision(value)} className="accent-purple-600" />
                  {t(`decisions.${value}`)}
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="review-notes" className="block text-sm font-semibold text-gray-700 mb-1">{t("modal.notes")}</label>
            <textarea
              id="review-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder={t("modal.notesPlaceholder")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <p className="text-xs text-gray-500">{t("modal.certificateNote")}</p>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-gray-200">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>{t("modal.cancel")}</Button>
          <Button type="submit" disabled={submitting} className="bg-purple-600 hover:bg-purple-700 text-white">
            {submitting && <Loader2 className="w-4 h-4 me-1 animate-spin" />}
            {submitting ? t("modal.submitting") : t("modal.submit")}
          </Button>
        </div>
      </form>
    </div>
  );
}
