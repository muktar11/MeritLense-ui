"use client";

import { useLocale } from "next-intl";
import { Search } from "lucide-react";
import type { Candidate } from "@/app/api/candidates/types";
import type { EvaluationListItem } from "@/app/api/evaluations/types";

export function hasAssessmentResult(item: EvaluationListItem) {
  return item.status === 'COMPLETED' || (item.status !== 'CANCELLED' && item.assessment_mode === 'SCHEDULED_INTERVIEW' && !!item.evaluator_rating);
}

export const panel = "rounded-xl border border-sky-100 bg-white overflow-hidden";
export const outlineButton = "rounded-md border border-blue-300 bg-white px-4 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-gray-200 disabled:bg-gray-100 disabled:text-gray-400";
export const primaryButton = "rounded-md bg-linear-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:cursor-not-allowed disabled:from-gray-200 disabled:to-gray-200 disabled:text-gray-500";
export function useAssessmentText() {
  const locale = useLocale();
  return (en: string, ar: string) => locale === "ar" ? ar : en;
}
export function AssessmentType({ mode }: { mode: EvaluationListItem['assessment_mode'] }) {
  const text = useAssessmentText();
  const scheduled = mode === 'SCHEDULED_INTERVIEW';
  return <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${scheduled ? 'bg-violet-100 text-violet-800' : 'bg-blue-100 text-blue-800'}`}>
    {scheduled ? text('Scheduled assessment', 'تقييم مجدول') : text('AI assessment', 'تقييم بالذكاء الاصطناعي')}
  </span>;
}
export function CandidateIdentity({ name, candidate, role }: { name: string; candidate?: Candidate; role?: string }) {
  return <div className="flex items-center gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 font-bold text-violet-700">{candidate?.profile_photo ? <img src={candidate.profile_photo} alt="" className="h-full w-full object-cover" /> : name.split(" ").map(word => word[0]).slice(0, 2).join("")}</div><div><p className="font-semibold text-slate-950">{name}</p><p className="text-xs text-slate-500">{role || candidate?.job_role || "—"}</p></div></div>;
}
export function AssessmentFilters({ search, onSearch, from, to, onDates }: { search: string; onSearch: (value: string) => void; from: string; to: string; onDates: (from: string, to: string) => void }) {
  const text = useAssessmentText();
  const input = "h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-700";
  return <div className="grid items-end gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
    <label className="space-y-1 text-xs font-medium">{text("Search candidate", "البحث عن مرشح")}<span className="relative mt-1 block"><Search className="absolute start-3 top-3 h-4 w-4 text-slate-500" /><input className={`${input} ps-9`} value={search} onChange={event => onSearch(event.target.value)} placeholder={text("Name, email or candidate ID", "الاسم أو البريد الإلكتروني أو معرف المرشح")} /></span></label>
    <label className="space-y-1 text-xs font-medium">{text("Assessment date — from", "تاريخ التقييم — من")}<input type="date" aria-label={text("From date", "من تاريخ")} className={`${input} mt-1`} value={from} max={to || undefined} onChange={event => onDates(event.target.value, to)} /></label>
    <label className="space-y-1 text-xs font-medium">{text("To date", "إلى تاريخ")}<input type="date" className={`${input} mt-1`} value={to} min={from || undefined} onChange={event => onDates(from, event.target.value)} /></label>
    <button className={outlineButton} onClick={() => { const now = new Date(); const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`; onDates(today, today); }}>{text("Today", "اليوم")}</button>
  </div>;
}
export function assessmentDate(value: string, locale: string) { const date = new Date(value); return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" }); }
export function localDate(value: string) { const date = new Date(value); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
