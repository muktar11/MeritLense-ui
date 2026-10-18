"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronUp, Info, Loader2, Plus } from "lucide-react";
import { useAuth } from "@/app/hooks/useAuth";
import evaluationService from "@/app/api/evaluations/endpoints";
import candidateService from "@/app/api/candidates/endpoints";
import type { Candidate } from "@/app/api/candidates/types";
import type { Evaluation, EvaluationListItem, CreateEvaluationData, CompleteEvaluationData } from "@/app/api/evaluations/types";
import EvaluationModal from "@/app/[locale]/dashboard/business/components/schedule-evaluation-modal";
import StartSessionModal from "@/app/[locale]/dashboard/business/components/start-session-modal";
import CompleteEvaluationModal from "@/app/[locale]/dashboard/business/components/complete-evaluation-modal";
import { apiErrorMessage } from "@/lib/api-error-message";
import { AssessmentFilters, AssessmentType, CandidateIdentity, hasAssessmentResult, assessmentDate, localDate, outlineButton, panel, primaryButton, useAssessmentText } from "./assessment-ui";

export function EvaluationsPage({ scope }: { scope: "business" | "indivisual" }) {
  const text = useAssessmentText();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const { userRole, userId } = useAuth();
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(() => params.get("candidate") || "");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [method, setMethod] = useState("");
  const [status, setStatus] = useState("");
  const [details, setDetails] = useState<Evaluation | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [modal, setModal] = useState<"create" | "edit" | "reschedule" | null>(null);
  const [editing, setEditing] = useState<Evaluation | null>(null);
  const [start, setStart] = useState(false);
  const [complete, setComplete] = useState<EvaluationListItem | null>(null);
  const [page, setPage] = useState(0);
  useEffect(() => {
    if (details) document.getElementById("evaluation-session-details")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [details]);
  async function load() {
    setLoading(true); setError("");
    try { const [evaluations, people] = await Promise.all([evaluationService.getEvaluations(), candidateService.getCandidates()]); setItems(evaluations); setCandidates(people); }
    catch (error) { setError(apiErrorMessage(error) || text("Unable to load evaluations. Please retry.", "تعذر تحميل التقييمات. يرجى إعادة المحاولة.")); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);
  const personFor = (item: EvaluationListItem) => candidates.find(candidate => candidate.id === item.candidate);
  const filtered = items.filter(item => {
    const candidate = personFor(item);
    const matches = `${item.candidate_name} ${item.candidate_email || candidate?.email || ""} ${item.candidate} ${candidate?.passport_id ?? ""}`.toLowerCase().includes(search.toLowerCase());
    const date = localDate(item.completed_at || item.scheduled_date);
    return matches && (!from || date >= from) && (!to || date <= to) && (!method || item.assessment_mode === method) && (!status || item.status === status);
  });
  useEffect(() => { setPage(0); }, [search, from, to, method, status]);
  async function openDetails(item: EvaluationListItem, mode?: "edit" | "reschedule") {
    setBusyId(item.id); setError("");
    try { const evaluation = await evaluationService.getEvaluation(item.id); if (mode) { setEditing(evaluation); setModal(mode); } else setDetails(evaluation); }
    catch (error) { setError(apiErrorMessage(error) || text("Unable to load session details.", "تعذر تحميل تفاصيل الجلسة.")); }
    finally { setBusyId(null); }
  }
  async function save(data: CreateEvaluationData) {
    try { if (modal === "edit" && editing) await evaluationService.updateEvaluation(editing.id, data); else await evaluationService.createEvaluation(data); await load(); return true; }
    catch (error) { setError(apiErrorMessage(error) || text("Unable to save changes.", "تعذر حفظ التغييرات.")); return false; }
  }
  function statusLabel(item: EvaluationListItem) {
    if (hasAssessmentResult(item)) return item.assessment_mode === "SCHEDULED_INTERVIEW" && item.evaluator_rating ? text("Finalized", "نهائي") : text("Completed", "مكتمل");
    return ({ SCHEDULED: text("Scheduled", "مجدول"), RESCHEDULED: text("Rescheduled", "أعيدت جدولته"), IN_PROGRESS: text("Processing", "قيد المعالجة"), CANCELLED: text("Cancelled", "ملغى") } as Record<string, string>)[item.status] || item.status_display;
  }
  return <main className="min-h-screen bg-linear-to-br from-sky-50/70 via-white to-violet-50/40 p-4 text-blue-950 md:p-7"><div className="mx-auto max-w-7xl space-y-5">
    <header><h1 className="text-3xl font-bold tracking-tight">{text("Evaluations", "التقييمات")}</h1><p className="mt-1 text-sm text-slate-600">{text("Manage sessions and open completed results", "إدارة الجلسات وفتح النتائج المكتملة")}</p></header>
    <div className="flex flex-wrap gap-3"><button className={`${primaryButton} flex items-center gap-2 bg-linear-to-r from-blue-500 to-violet-600`} onClick={() => setStart(true)}><Plus className="h-4 w-4" />{text("Start AI Interview", "بدء مقابلة بالذكاء الاصطناعي")}</button><button className={`${primaryButton} flex items-center gap-2`} onClick={() => { setEditing(null); setModal("create"); }}><Plus className="h-4 w-4" />{text("Schedule Evaluation", "جدولة تقييم")}</button></div>
    {error && <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error} <button onClick={load} className="underline">{text("Retry", "إعادة المحاولة")}</button></div>}
    <section className={`${panel} space-y-4 p-4`}><AssessmentFilters search={search} onSearch={setSearch} from={from} to={to} onDates={(a, b) => { setFrom(a); setTo(b); }} /><div className="flex flex-wrap items-end gap-4">
      <label className="text-xs font-medium">{text("Method", "الطريقة")}<select className="mt-1 block w-48 rounded-md border border-slate-300 bg-white p-2 text-sm" value={method} onChange={event => setMethod(event.target.value)}><option value="">{text("All", "الكل")}</option><option value="AI_INTERVIEW">{text("AI-assisted", "بمساعدة الذكاء الاصطناعي")}</option><option value="SCHEDULED_INTERVIEW">{text("Employer-led", "بقيادة صاحب العمل")}</option></select></label>
      <label className="text-xs font-medium">{text("Status", "الحالة")}<select className="mt-1 block w-48 rounded-md border border-slate-300 bg-white p-2 text-sm" value={status} onChange={event => setStatus(event.target.value)}><option value="">{text("All", "الكل")}</option>{["SCHEDULED", "IN_PROGRESS", "COMPLETED", "RESCHEDULED", "CANCELLED"].map(value => <option key={value} value={value}>{statusLabel({ status: value } as EvaluationListItem)}</option>)}</select></label>
      <button className="ms-auto py-2 text-sm text-blue-700 underline" onClick={() => { setSearch(""); setFrom(""); setTo(""); setMethod(""); setStatus(""); }}>{text("Clear filters", "مسح الفلاتر")}</button>
    </div></section>
    <section className={panel}><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-start text-sm"><thead className="bg-sky-50/70"><tr>{[text("Candidate / Role", "المرشح / الدور"), text("Method", "الطريقة"), text("Type", "النوع"), text("Status", "الحالة"), text("Actions", "الإجراءات")].map(label => <th key={label} className="p-4 text-start font-semibold">{label}</th>)}</tr></thead><tbody>
      {loading ? <tr><td colSpan={5} className="p-10 text-center"><Loader2 aria-label={text("Loading", "جار التحميل")} className="mx-auto h-6 w-6 animate-spin" /></td></tr> : filtered.slice(page * 10, page * 10 + 10).map(item => <tr key={item.id} className="border-t border-sky-100 hover:bg-sky-50/30"><td className="p-4"><CandidateIdentity name={item.candidate_name} candidate={personFor(item)} role={item.candidate_job_role} /></td><td className="p-4 text-slate-600">{item.assessment_mode === "SCHEDULED_INTERVIEW" ? text("Employer-led", "بقيادة صاحب العمل") : text("AI-assisted", "بمساعدة الذكاء الاصطناعي")} {item.assessment_mode !== "SCHEDULED_INTERVIEW" && <span>· {item.evaluation_tier === "SCREENING" ? text("Screening", "فحص أولي") : text("Full", "كامل")}</span>}<p className="mt-1 text-xs text-slate-400">{assessmentDate(item.completed_at || item.scheduled_date, locale)}</p></td><td className="p-4"><AssessmentType mode={item.assessment_mode} /></td><td className="p-4"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.status === "COMPLETED" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"}`}>{statusLabel(item)}</span></td><td className="p-4"><div className="flex flex-wrap gap-2"><button className={outlineButton} disabled={busyId === item.id} onClick={() => openDetails(item)}>{text("Details", "التفاصيل")}</button><button className={primaryButton} disabled={!hasAssessmentResult(item)} onClick={() => router.push(`/${locale}/dashboard/${scope}/score-management?assessment=${item.id}`)}>{hasAssessmentResult(item) ? text("View result", "عرض النتيجة") : statusLabel(item)}</button>
      {!hasAssessmentResult(item) && (item.status === "SCHEDULED" || item.status === "RESCHEDULED") && <details className="relative"><summary className="cursor-pointer p-2">{text("Manage", "إدارة")}</summary><div className="flex gap-2 py-2"><button className={outlineButton} onClick={() => openDetails(item, "edit")}>{text("Edit", "تعديل")}</button><button className={outlineButton} onClick={() => openDetails(item, "reschedule")}>{text("Reschedule", "إعادة الجدولة")}</button><button className={outlineButton} onClick={async () => { if (!confirm(text("Cancel this evaluation?", "إلغاء هذا التقييم؟"))) return; try { await evaluationService.cancelEvaluation(item.id, { reason: "Cancelled by user" }); await load(); } catch (error) { setError(apiErrorMessage(error) || text("Unable to save changes.", "تعذر حفظ التغييرات.")); } }}>{text("Cancel", "إلغاء")}</button></div></details>}
      {item.status === "IN_PROGRESS" && !hasAssessmentResult(item) && <button className={outlineButton} onClick={() => setComplete(item)}>{text("Complete", "إكمال")}</button>}
      </div></td></tr>)}
      {!loading && filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">{text("No evaluations match these filters.", "لا توجد تقييمات تطابق الفلاتر.")}</td></tr>}
    </tbody></table></div>{filtered.length > 10 && <div className="flex items-center justify-end gap-3 border-t p-3"><button className={outlineButton} disabled={page === 0} onClick={() => setPage(value => value - 1)}>{text("Previous", "السابق")}</button><span className="text-xs">{page + 1} / {Math.ceil(filtered.length / 10)}</span><button className={outlineButton} disabled={(page + 1) * 10 >= filtered.length} onClick={() => setPage(value => value + 1)}>{text("Next", "التالي")}</button></div>}</section>
    {details && <section id="evaluation-session-details" className={panel}><header className="flex justify-between bg-sky-50/70 p-4 font-semibold">{text("Session details", "تفاصيل الجلسة")} — {details.candidate_first_name} {details.candidate_last_name}<button onClick={() => setDetails(null)} aria-label={text("Close session details", "إغلاق تفاصيل الجلسة")}><ChevronUp className="h-5 w-5" /></button></header><div className="grid gap-5 p-5 md:grid-cols-[1fr_2fr]"><CandidateIdentity name={`${details.candidate_first_name} ${details.candidate_last_name}`} candidate={details.candidate_details} role={details.candidate_job_role} /><dl className="grid grid-cols-2 gap-4 text-sm">{[[text("Role", "الدور"), details.candidate_job_role], [text("Date", "التاريخ"), assessmentDate(details.scheduled_date, locale)], [text("Method", "الطريقة"), details.assessment_mode === "SCHEDULED_INTERVIEW" ? text("Employer-led", "بقيادة صاحب العمل") : text("AI-assisted", "بمساعدة الذكاء الاصطناعي")], [text("Evaluator / organizer", "المقيّم / المنظم"), details.evaluator_rating?.rated_by_name || details.created_by_name], [text("Language", "اللغة"), details.candidate_preferred_language], [text("Duration", "المدة"), `${details.duration_minutes} ${text("minutes", "دقيقة")}`]].map(([label, value]) => <div key={label}><dt className="text-xs text-slate-500">{label}</dt><dd>{value || "—"}</dd></div>)}{details.meeting_link && details.status !== "COMPLETED" && <a href={details.meeting_link} target="_blank" rel="noopener noreferrer" className="text-blue-700 underline">{text("Candidate session link", "رابط جلسة المرشح")}</a>}{details.session_id && details.assessment_mode === "SCHEDULED_INTERVIEW" && details.status !== "COMPLETED" && <a href={`/${locale}/dashboard/${scope}/live-call?sessionId=${details.session_id}`} className="text-blue-700 underline">{text("Join as evaluator", "الانضمام كمقيّم")}</a>}</dl></div><p className="m-4 flex items-center gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800"><Info className="h-4 w-4 shrink-0" />{text("‘Details’ opens session information only. Scores and documents are available in Assessment Results.", "تعرض التفاصيل معلومات الجلسة فقط. الدرجات والمستندات متاحة في نتائج التقييم.")}</p></section>}
  </div>
  <EvaluationModal isOpen={modal !== null} onClose={() => setModal(null)} mode={modal || "create"} evaluation={editing || undefined} candidates={candidates} userRole={userRole || undefined} currentUserId={userId || undefined} onSubmit={save} errorMessage={error} onReschedule={async data => { if (!editing) return false; try { await evaluationService.rescheduleEvaluation(editing.id, data); await load(); return true; } catch (error) { setError(apiErrorMessage(error) || text("Unable to save changes.", "تعذر حفظ التغييرات.")); return false; } }} />
  <StartSessionModal isOpen={start} onClose={() => setStart(false)} candidate={null} candidates={candidates} onSuccess={() => { void load(); }} />
  {complete && <CompleteEvaluationModal isOpen onClose={() => setComplete(null)} candidateName={complete.candidate_name} onSubmit={async data => { try { await evaluationService.completeEvaluation(complete.id, data as CompleteEvaluationData); await load(); return true; } catch (error) { setError(apiErrorMessage(error) || text("Unable to save changes.", "تعذر حفظ التغييرات.")); return false; } }} />}
  </main>;
}
