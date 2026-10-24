"use client";

import { Fragment, type ComponentType } from "react";
import { useTranslations } from "next-intl";
import { Check, ClipboardList, ListChecks, MessageCircle, ShieldCheck, UserRound } from "lucide-react";
import type { ScorecardCompetency } from "@/app/api/evaluations/types";
import { LANGUAGES } from "@/lib/languages";
import { useAssessmentText } from "@/components/evaluations/assessment-ui";

// Scheduled assessment (employer-led / evaluator-rated) flow: Interview ->
// Scorecard -> Results. Shared by the B2B and B2C dashboards.

export type ScheduledStage = "interview" | "scorecard" | "results";

export interface CompetencyMeta {
  key: ScorecardCompetency;
  icon: ComponentType<{ className?: string }>;
  label: [string, string];
  description: [string, string];
}

// Display order of the approved scorecard competencies. Behavioral
// Indicators is rated but not part of the average (SCH-06).
export const COMPETENCIES: CompetencyMeta[] = [
  {
    key: "safety_awareness", icon: ShieldCheck, label: ["Safety Awareness", "الوعي بالسلامة"],
    description: [
      "Identifies risks, recognizes changes in a person's condition or the work area, and acts to keep people safe.",
      "يحدد المخاطر ويلاحظ التغيرات في حالة الشخص أو بيئة العمل ويتصرف للحفاظ على السلامة.",
    ],
  },
  {
    key: "hygiene", icon: ClipboardList, label: ["Hygiene & Standards", "النظافة والمعايير"],
    description: [
      "Follows hygiene, cleanliness and infection-prevention practices expected in the role.",
      "يتبع ممارسات النظافة والوقاية من العدوى المتوقعة في الدور.",
    ],
  },
  {
    key: "communication", icon: MessageCircle, label: ["Communication Ability", "مهارات التواصل"],
    description: [
      "Explains clearly, listens, reports and hands over information accurately.",
      "يشرح بوضوح ويستمع وينقل المعلومات ويسلّمها بدقة.",
    ],
  },
  {
    key: "task_execution", icon: ListChecks, label: ["Practical Task Execution", "تنفيذ المهام العملية"],
    description: [
      "Knows the steps of the role's tasks and carries them out in a sensible order.",
      "يعرف خطوات مهام الدور وينفذها بترتيب سليم.",
    ],
  },
  {
    key: "behavior_integrity", icon: UserRound, label: ["Behavioral Indicators", "المؤشرات السلوكية"],
    description: [
      "Integrity, reliability and professional conduct in work situations. Shown as a risk level in documents.",
      "النزاهة والموثوقية والسلوك المهني في مواقف العمل. يُعرض كمستوى خطر في المستندات.",
    ],
  },
];

export function useCompetencyText() {
  const text = useAssessmentText();
  return {
    label: (meta: CompetencyMeta) => text(...meta.label),
    description: (meta: CompetencyMeta) => text(...meta.description),
  };
}

export function useLanguageName() {
  const t = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages");
  return (code?: string | null) => {
    if (!code) return "—";
    const base = code.split("-")[0].toUpperCase();
    const match = LANGUAGES.find((lang) => lang.code === code) ?? LANGUAGES.find((lang) => lang.key === base);
    return match ? t(match.key) : code;
  };
}

export function initials(name: string) {
  return name.split(" ").filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase();
}

export function ScheduledModeBadge({ className = "" }: { className?: string }) {
  const text = useAssessmentText();
  return (
    <span className={`inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800 ${className}`}>
      {text("Employer-Led / Evaluator-Rated", "بقيادة صاحب العمل / تقييم المقيّم")}
    </span>
  );
}

// The three stages; completed ones show a check. Not clickable: the
// interview cannot be reopened after the call ends and results exist only
// after the final submission.
export function ScheduledStepper({ stage }: { stage: ScheduledStage }) {
  const text = useAssessmentText();
  const steps: [ScheduledStage, string][] = [
    ["interview", text("Interview", "المقابلة")],
    ["scorecard", text("Scorecard", "بطاقة التقييم")],
    ["results", text("Results", "النتائج")],
  ];
  const current = steps.findIndex(([key]) => key === stage);
  return (
    <ol aria-label={text("Assessment progress", "مراحل التقييم")} className="flex items-center gap-2">
      {steps.map(([key, label], index) => {
        const done = index < current;
        const active = index === current;
        return (
          <Fragment key={key}>
            {index > 0 && <li aria-hidden className={`h-px w-8 sm:w-14 ${index <= current ? "bg-blue-500" : "bg-slate-200"}`} />}
            <li className="flex flex-col items-center gap-1 sm:flex-row sm:gap-2" aria-current={active ? "step" : undefined}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold ${
                done ? "border-blue-600 bg-blue-600 text-white" : active ? "border-blue-600 bg-blue-600 text-white ring-4 ring-blue-100" : "border-slate-300 bg-white text-slate-400"
              }`}>
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span className={`text-xs sm:text-sm ${active ? "font-semibold text-blue-700" : done ? "text-slate-700" : "text-slate-400"}`}>{label}</span>
            </li>
          </Fragment>
        );
      })}
    </ol>
  );
}
