"use client";

import { useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { AlertTriangle, ArrowRight, CheckCircle2, FileQuestion, Loader2, UserCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type { AttentionReason, RequiresAttention } from "@/app/api/dashboard/b2b/types";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { Evaluation } from "@/app/api/evaluations/types";
import EvaluationModal from "./schedule-evaluation-modal";

interface RequiresAttentionPanelProps {
  data: RequiresAttention;
}

const REASON_STYLES: Record<AttentionReason, string> = {
  HUMAN_REVIEW: "bg-amber-50 text-amber-700 border-amber-200",
  INSUFFICIENT_EVIDENCE: "bg-slate-50 text-slate-600 border-slate-200",
};

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// Decision-oriented queue: completed evaluations flagged for human review,
// or without enough evidence for a readiness decision - "who needs
// attention / what should I review next".
export function RequiresAttentionPanel({ data }: RequiresAttentionPanelProps) {
  const t = useTranslations("dashboard.business.overview.requiresAttention");
  const locale = useLocale();
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<Evaluation | null>(null);

  const openEvaluation = async (evaluationId: string) => {
    setOpeningId(evaluationId);
    try {
      setSelectedEvaluation(await evaluationService.getEvaluation(evaluationId));
    } catch (error) {
      console.error("Failed to fetch evaluation details:", error);
    } finally {
      setOpeningId(null);
    }
  };

  const remaining = data.total - data.items.length;

  return (
    <Card className="bg-white border-gray-100 h-full" dir={locale === "ar" ? "rtl" : "ltr"}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
              {t("title")}
              {data.total > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  {data.total}
                </span>
              )}
            </CardTitle>
            <p className="mt-1 text-xs text-gray-500">{t("subtitle")}</p>
          </div>
        </div>
        {data.total > 0 && (
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2">
              <UserCheck className="h-4 w-4 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none text-gray-900">{data.human_review}</p>
                <p className="mt-1 truncate text-[11px] text-gray-600">{t("reasons.HUMAN_REVIEW")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2">
              <FileQuestion className="h-4 w-4 shrink-0 text-slate-500" />
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none text-gray-900">{data.insufficient_evidence}</p>
                <p className="mt-1 truncate text-[11px] text-gray-600">{t("reasons.INSUFFICIENT_EVIDENCE")}</p>
              </div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {data.items.length === 0 ? (
          <div className="flex min-h-36 flex-col items-center justify-center gap-2 text-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-sm font-medium text-gray-700">{t("empty")}</p>
            <p className="text-xs text-gray-500">{t("emptyHint")}</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {data.items.map((item) => (
              <li key={item.evaluation_id} className="flex items-center gap-3 py-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-amber-50 text-xs text-amber-800">
                    {initials(item.candidate_name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.candidate_name}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="text-xs text-gray-500">{item.job_role_display}</span>
                    {item.reasons.map((reason) => (
                      <span
                        key={reason}
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] ${REASON_STYLES[reason]}`}
                      >
                        {reason === "HUMAN_REVIEW" && <AlertTriangle className="h-3 w-3" />}
                        {t(`reasons.${reason}`)}
                      </span>
                    ))}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="shrink-0"
                  disabled={openingId === item.evaluation_id}
                  onClick={() => openEvaluation(item.evaluation_id)}
                >
                  {openingId === item.evaluation_id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : t("review")}
                </Button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-3 flex items-center justify-between border-t border-gray-100 pt-3 text-xs">
          <span className="text-gray-500">{remaining > 0 ? t("moreCount", { count: remaining }) : ""}</span>
          <Link
            href={`/${locale}/dashboard/business/candidate-evaluation`}
            className="inline-flex items-center gap-1 font-medium text-blue-600 hover:text-blue-700"
          >
            {t("viewAll")}
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </Link>
        </div>
      </CardContent>

      <EvaluationModal
        isOpen={selectedEvaluation !== null}
        onClose={() => setSelectedEvaluation(null)}
        mode="view"
        evaluation={selectedEvaluation}
      />
    </Card>
  );
}
