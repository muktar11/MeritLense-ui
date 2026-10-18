"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Award, BarChart3, CheckCircle2, Clock, FileText, Info, Loader2, Settings } from "lucide-react";
import evaluationService, { type AssessmentResultsData } from "@/app/api/evaluations/endpoints";
import candidateService from "@/app/api/candidates/endpoints";
import reportService from "@/app/api/reports/endpoints";
import type { Candidate } from "@/app/api/candidates/types";
import type { EvaluationListItem } from "@/app/api/evaluations/types";
import { apiErrorMessage } from "@/lib/api-error-message";
import { AssessmentFilters, AssessmentType, CandidateIdentity, hasAssessmentResult, assessmentDate, localDate, outlineButton, panel, primaryButton, useAssessmentText } from "./assessment-ui";

type Tab = "overview" | "competencies" | "documents" | "history";
export function AssessmentResultsPage({ scope }: { scope: "business" | "indivisual" }) {
  const text = useAssessmentText();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const selected = params.get("assessment");
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [data, setData] = useState<AssessmentResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("documents");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    Promise.all([evaluationService.getEvaluations(), candidateService.getCandidates()]).then(([evaluations, people]) => {
      if (active) { setItems(evaluations.filter(hasAssessmentResult)); setCandidates(people); }
    }).catch(error => { if (active) setError(apiErrorMessage(error) || text("Unable to load assessments.", "تعذر تحميل التقييمات.")); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);
  useEffect(() => {
    let active = true;
    setData(null); setShowTranscript(false); setTab("documents"); setError("");
    if (!selected) { setLoadingDetail(false); return; }
    setLoadingDetail(true);
    evaluationService.getAssessmentResults(selected).then(result => { if (active) setData(result); }).catch(error => { if (active) setError(apiErrorMessage(error) || text("Unable to open this assessment result.", "تعذر فتح نتيجة التقييم.")); }).finally(() => { if (active) setLoadingDetail(false); });
    return () => { active = false; };
  }, [selected, attempt]);
  function open(id?: string) { router.push(`/${locale}/dashboard/${scope}/score-management${id ? `?assessment=${encodeURIComponent(id)}` : ""}`); }
  const personFor = (id: string) => candidates.find(candidate => candidate.id === id);
  const filtered = items.filter(item => {
    const person = personFor(item.candidate);
    const date = localDate(item.completed_at || item.scheduled_date);
    return `${item.candidate_name} ${item.candidate_email || person?.email || ""} ${item.candidate}`.toLowerCase().includes(search.toLowerCase()) && (!from || date >= from) && (!to || date <= to);
  });
  const evaluation = data?.evaluation;
  const report = data?.reports.find(item => item.report_status === "ACTIVE");
  const screening = evaluation?.evaluation_tier === "SCREENING";
  const employerLed = evaluation?.assessment_mode === "SCHEDULED_INTERVIEW";
  const method = (employer: boolean, tier?: string) => employer ? text("Employer-led", "بقيادة صاحب العمل") : `${text("AI-assisted", "بمساعدة الذكاء الاصطناعي")} · ${tier === "SCREENING" ? text("Screening", "فحص أولي") : tier ? text("Full", "كامل") : text("Assessment", "تقييم")}`;
  const ready = screening ? text("Preliminary outcome", "نتيجة أولية") : ({ READY: text("Ready", "جاهز"), PARTIALLY_READY: text("Partially Ready", "جاهز جزئيًا"), NOT_READY: text("Not Ready", "غير جاهز"), INCOMPLETE: text("Insufficient evidence", "أدلة غير كافية"), PENDING: text("Pending", "قيد الانتظار") } as Record<string, string>)[evaluation?.readiness_status || report?.readiness_status || "PENDING"] || text("Pending", "قيد الانتظار");
  const validCertificate = evaluation?.certificate_status === "ISSUED" && evaluation.certificate_enabled !== false && !screening && !!evaluation.certificate_url;
  const certificateLabel = validCertificate ? text("Available", "متاحة") : evaluation?.certificate_status === "PENDING" ? text("Pending", "قيد الانتظار") : evaluation?.certificate_status === "REVOKED" ? text("Revoked", "ملغاة") : evaluation?.certificate_status === "EXPIRED" ? text("Expired", "منتهية") : text("Not eligible / not issued", "غير مؤهل / لم تصدر");
  const transcriptAvailable = !!data?.transcript.length;
  const eligibilityReason = ({
    VERIFICATION_FAILED: text("Candidate identity verification is required.", "يجب التحقق من هوية المرشح."),
    CONSENT_REQUIRED: text("Signed candidate consent is required.", "تلزم موافقة المرشح الموقعة."),
    SCREENING_NO_CERTIFICATE: text("Screening assessments do not issue a readiness certificate.", "لا تصدر شهادة جاهزية للفحص الأولي."),
    CERTIFICATE_DISABLED: text("Certificate issuance is disabled for this assessment.", "إصدار الشهادة معطل لهذا التقييم."),
    COMPLETION_UNVERIFIED: text("Finalize the evaluator-rated assessment to check certificate eligibility.", "أكمل التقييم للتحقق من أهلية الشهادة."),
    EVALUATOR_RATING_PENDING: text("Final evaluator ratings are required.", "تلزم تقييمات المقيّم النهائية."),
    INCOMPLETE: text("Complete assessment evidence is required.", "تلزم أدلة تقييم مكتملة."),
    HUMAN_REVIEW_PENDING: text("An authorized review must be completed first.", "يجب إكمال المراجعة المصرح بها أولاً."),
  } as Record<string, string>)[data?.certificate_eligibility?.reason || ""];
  async function finalizeScheduled() {
    if (!selected) return;
    await documentAction(async () => {
      await evaluationService.finalizeScheduledAssessment(selected);
      setData(await evaluationService.getAssessmentResults(selected));
      setItems((await evaluationService.getEvaluations()).filter(hasAssessmentResult));
    });
  }
  async function documentAction(action: () => Promise<void>) { setDocumentBusy(true); setError(""); try { await action(); } catch (error) { setError(apiErrorMessage(error) || text("Unable to open document. Please retry.", "تعذر فتح المستند. يرجى إعادة المحاولة.")); } finally { setDocumentBusy(false); } }
  function transcriptDownload() {
    if (!data || !evaluation) return;
    const content = [`${text("Interview Transcript", "نص المقابلة")} — ${evaluation.candidate_first_name} ${evaluation.candidate_last_name}`, evaluation.id, ...data.transcript.map((item, index) => `${index + 1}. ${item.question}\n${item.responses.length ? item.responses.map(response => `${text("Original", "الأصل")} (${response.language || evaluation.candidate_preferred_language}): ${response.original || text("Missing / unclear", "مفقود / غير واضح")}${response.translation ? `\n${text("Translation", "الترجمة")} (${response.translation_language}): ${response.translation}` : ""}`).join("\n") : text("Unanswered", "لم تتم الإجابة")}`)].join("\n\n");
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${evaluation.id}-interview-transcript.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function DocumentRow({ icon: Icon, title, description, available, status, onView, onDownload, note }: { icon: ComponentType<{ className?: string }>; title: string; description: string; available: boolean; status: string; onView: () => void; onDownload: () => void; note?: string }) {
    return <div className="border-t border-sky-100 p-4"><div className="grid items-center gap-4 lg:grid-cols-[2fr_2fr_auto]"><div className="flex items-center gap-3"><Icon className={`h-10 w-10 shrink-0 ${title === text("Readiness Certificate", "شهادة الجاهزية") ? "text-amber-500" : title === text("Interview Transcript", "نص المقابلة") ? "text-blue-600" : "text-fuchsia-600"}`} /><h3 className="font-bold">{title}</h3></div><div><span className={`rounded-full px-3 py-1 text-xs ${available ? "bg-emerald-100 text-emerald-800" : "bg-amber-50 text-amber-800"}`}>{status}</span><p className="mt-2 text-xs text-slate-500">{description}</p></div><div className="flex gap-2"><button className={outlineButton} disabled={!available || documentBusy} onClick={onView}>{text("View", "عرض")}</button><button className={primaryButton} disabled={!available || documentBusy} onClick={onDownload}>{text("Download", "تنزيل")}</button></div></div>{note && <p className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800"><Info className="h-4 w-4 shrink-0" />{note}</p>}</div>;
  }
  return <main className="min-h-screen bg-linear-to-br from-sky-50/70 via-white to-violet-50/40 p-4 text-blue-950 md:p-7"><div className="mx-auto max-w-7xl space-y-4">
    {selected && <button className="flex items-center gap-2 text-sm text-blue-700" onClick={() => open()}><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{text("Back to results list", "العودة إلى قائمة النتائج")}</button>}
    <header className="flex flex-wrap items-end justify-between gap-2"><h1 className="text-3xl font-bold tracking-tight">{text("Assessment Results", "نتائج التقييم")}</h1><p className="text-xs text-slate-500">{text("One page per assessment · Also opened from Evaluations.", "صفحة لكل تقييم · تُفتح أيضًا من التقييمات.")}</p></header>
    <section className={panel}><h2 className="bg-sky-50/70 px-4 py-2 text-sm font-semibold">{text("Assessment Results list — search & date filters", "قائمة نتائج التقييم — البحث وفلاتر التاريخ")}</h2><div className="p-4"><AssessmentFilters search={search} onSearch={setSearch} from={from} to={to} onDates={(a, b) => { setFrom(a); setTo(b); if (selected) open(); }} />{(search || from || to) && <button className="mt-3 text-xs text-blue-700 underline" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}>{text("Clear filters", "مسح الفلاتر")}</button>}{selected && search && <button className={`${outlineButton} mt-3`} onClick={() => open()}>{text("Search results list", "البحث في قائمة النتائج")}</button>}</div></section>
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error} <button className="underline" onClick={() => setAttempt(value => value + 1)}>{text("Retry", "إعادة المحاولة")}</button></p>}
    {loading || loadingDetail ? <div role="status" className="p-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" /><p className="mt-3 text-sm">{text("Loading assessment results…", "جار تحميل نتائج التقييم…")}</p></div> : !selected ? <section className={panel}><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="bg-sky-50/70"><tr>{[text("Candidate / Role", "المرشح / الدور"), text("Method", "الطريقة"), text("Type", "النوع"), text("Assessment date", "تاريخ التقييم"), text("Actions", "الإجراءات")].map(label => <th key={label} className="p-4 text-start">{label}</th>)}</tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-t border-sky-100"><td className="p-4"><CandidateIdentity name={item.candidate_name} candidate={personFor(item.candidate)} role={item.candidate_job_role} /></td><td className="p-4">{method(item.assessment_mode === "SCHEDULED_INTERVIEW", item.evaluation_tier)}</td><td className="p-4"><AssessmentType mode={item.assessment_mode} /></td><td className="p-4">{assessmentDate(item.completed_at || item.scheduled_date, locale)}</td><td className="p-4"><button className={primaryButton} onClick={() => open(item.id)}>{text("View result", "عرض النتيجة")}</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">{text("No completed assessments match these filters.", "لا توجد تقييمات مكتملة تطابق الفلاتر.")}</td></tr>}</tbody></table></div></section> : evaluation && data ? <>
      <section className={`${panel} flex flex-wrap items-center gap-5 p-4`}><CandidateIdentity name={`${evaluation.candidate_first_name} ${evaluation.candidate_last_name}`} candidate={evaluation.candidate_details} role={evaluation.candidate_job_role} /><dl className="grid flex-1 gap-4 sm:grid-cols-4">{[[text("Method", "الطريقة"), method(!!employerLed, evaluation.evaluation_tier)], [text("Language", "اللغة"), evaluation.candidate_preferred_language], [text("Assessment date", "تاريخ التقييم"), assessmentDate(evaluation.completed_at || evaluation.scheduled_date, locale)], [text("Assessment ID", "معرف التقييم"), evaluation.id]].map(([label, value]) => <div key={label} className="min-w-0 border-s border-sky-100 ps-4"><dt className="text-xs text-slate-500">{label}</dt><dd className="mt-1 break-all text-sm">{value}</dd></div>)}</dl></section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
        { label: text("Completion", "الإكمال"), value: text("Completed", "مكتمل"), icon: CheckCircle2, style: "border-emerald-100 bg-emerald-50 text-emerald-800" },
        { label: screening ? text("Screening outcome", "نتيجة الفحص الأولي") : text("Readiness", "الجاهزية"), value: ready, icon: FileText, style: "border-blue-100 bg-blue-50 text-blue-800" },
        { label: text("Analysis report", "تقرير التحليل"), value: report ? text("Available", "متاح") : text("Not available yet", "غير متاح بعد"), icon: BarChart3, style: "border-emerald-100 bg-emerald-50 text-emerald-800" },
        { label: text("Certificate", "الشهادة"), value: certificateLabel, icon: Award, style: validCertificate ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-amber-100 bg-amber-50 text-amber-800" },
      ].map(({ label, value, icon: Icon, style }) => <div key={label} className={`flex items-center gap-3 rounded-lg border p-4 ${style}`}><Icon className="h-8 w-8 shrink-0" /><div><p className="text-xs">{label}</p><p className="mt-1 text-sm font-semibold">{value}</p></div></div>)}</div>
      <nav aria-label={text("Assessment result tabs", "تبويبات نتيجة التقييم")} className="flex overflow-x-auto border-b border-sky-100" role="tablist">{([['overview', text("Overview", "نظرة عامة")], ['competencies', text("Competencies", "الكفاءات")], ['documents', text("Documents", "المستندات")], ['history', text("History", "السجل")]] as [Tab, string][]).map(([key, label]) => <button key={key} id={`tab-${key}`} aria-controls={`panel-${key}`} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`border-b-3 px-5 py-3 text-sm ${tab === key ? "border-blue-600 font-bold text-blue-700" : "border-transparent text-slate-500"}`}>{label}</button>)}</nav>
      {employerLed && !validCertificate && <section className={`${panel} space-y-3 p-4`}>
        <p className="text-sm text-slate-600">{eligibilityReason || (data.certificate_eligibility?.eligible ? text("This assessment is eligible. Generate its certificate below.", "هذا التقييم مؤهل. أنشئ شهادته أدناه.") : text("Certificate eligibility checks have not passed.", "لم تُستوفَ شروط أهلية الشهادة."))}</p>
        {data.can_finalize && evaluation.certificate_enabled !== false && !screening && <button className={primaryButton} disabled={documentBusy} onClick={finalizeScheduled}>{documentBusy ? text("Checking eligibility…", "جار التحقق من الأهلية…") : text("Finalize & generate certificate", "إكمال التقييم وإنشاء الشهادة")}</button>}
      </section>}
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
      {tab === "documents" && <section className={panel}><h2 className="bg-sky-50/70 p-4 font-bold">{text("Documents — selected assessment only", "المستندات — للتقييم المحدد فقط")}</h2>
        <DocumentRow icon={FileText} title={text("Interview Transcript", "نص المقابلة")} available={transcriptAvailable} status={transcriptAvailable ? text("Available", "متاح") : text("No captured dialogue", "لا يوجد حوار مسجل")} description={text("Recorded questions, answers and unanswered items.", "الأسئلة والإجابات المسجلة والأسئلة التي لم تتم الإجابة عنها.")} onView={() => setShowTranscript(value => !value)} onDownload={transcriptDownload} note={text("Available regardless of pass / fail when recorded or captured text exists. Missing or unclear sections are marked; dialogue is never invented. Original-language text is retained and translations are clearly labelled.", "متاح بغض النظر عن النجاح أو الإخفاق عند وجود نص مسجل. تُحدد الأجزاء المفقودة أو غير الواضحة ولا يُختلق الحوار. يُحتفظ بالنص الأصلي وتُميز الترجمات بوضوح.")} />
        {showTranscript && <div className="max-h-[500px] space-y-4 overflow-auto border-t bg-slate-50 p-5">{data.transcript.map((item, index) => <article key={index}><h3 className="font-semibold">{index + 1}. {item.question}</h3>{item.responses.length ? item.responses.map((response, responseIndex) => <div key={responseIndex} className="mt-2 whitespace-pre-wrap text-sm"><p className="text-xs text-slate-500">{text("Original", "الأصل")} · {response.language || evaluation.candidate_preferred_language}</p><p>{response.original || text("Missing / unclear", "مفقود / غير واضح")}</p>{response.translation && <><p className="mt-2 text-xs text-slate-500">{text("Translation", "الترجمة")} · {response.translation_language}</p><p>{response.translation}</p></>}</div>) : <p className="text-sm text-slate-500">{text("Unanswered", "لم تتم الإجابة")}</p>}</article>)}</div>}
        <DocumentRow icon={BarChart3} title={text("Assessment Analysis Report", "تقرير تحليل التقييم")} available={!!report} status={report ? text("Available", "متاح") : text("Not available yet", "غير متاح بعد")} description={text("Performance analysis, competency scores and assessment gaps.", "تحليل الأداء ودرجات الكفاءة وفجوات التقييم.")} onView={() => { if (report) void documentAction(() => (employerLed ? reportService.viewPdf(report.id) : reportService.viewAiAnalysisPdf(report.id))); }} onDownload={() => { if (report) void documentAction(() => (employerLed ? reportService.downloadPdf(report.id, `${report.report_number}-assessment-analysis.pdf`) : reportService.downloadAiAnalysisPdf(report.id, `${report.report_number}-assessment-analysis.pdf`))); }} />
        <DocumentRow icon={Award} title={text("Readiness Certificate", "شهادة الجاهزية")} available={validCertificate} status={certificateLabel} description={text("Issued only when approved certificate requirements are met.", "تصدر فقط عند استيفاء متطلبات الشهادة المعتمدة.")} onView={() => { if (validCertificate) window.open(evaluation.certificate_url, "_blank", "noopener,noreferrer"); }} onDownload={() => { if (validCertificate) { const link = document.createElement("a"); link.href = evaluation.certificate_url!; link.download = `${evaluation.id}-readiness-certificate.pdf`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click(); } }} />
      </section>}
      {tab === "overview" && <section className={`${panel} space-y-4 p-5`}><h2 className="font-bold">{text("Assessment overview", "نظرة عامة على التقييم")}</h2><p className="text-sm">{screening ? text("Screening provides a preliminary outcome. It does not issue a readiness certificate.", "يوفر الفحص الأولي نتيجة مبدئية ولا يصدر شهادة جاهزية.") : `${text("Readiness", "الجاهزية")}: ${ready}`}</p>{!screening && evaluation.score !== undefined && evaluation.score !== null && <p className="text-3xl font-bold text-violet-700">{evaluation.score}%</p>}<p className="whitespace-pre-wrap text-sm text-slate-600">{evaluation.feedback || report?.readiness_reason || text("No additional assessment summary is available.", "لا يتوفر ملخص إضافي للتقييم.")}</p>{employerLed && evaluation.evaluator_rating?.comments && <div className="rounded-lg bg-sky-50 p-4"><h3 className="font-semibold">{text("Evaluator comments", "تعليقات المقيّم")}</h3><p className="mt-2 whitespace-pre-wrap text-sm">{evaluation.evaluator_rating.comments}</p></div>}</section>}
      {tab === "competencies" && <section className={`${panel} p-5`}><h2 className="mb-4 font-bold">{text("Competencies — selected assessment", "الكفاءات — التقييم المحدد")}</h2>{Array.isArray(report?.competency_breakdown) && report.competency_breakdown.length ? <div className="space-y-4">{report.competency_breakdown.map(item => <div key={item.competency_code}><div className="flex justify-between text-sm"><span>{item.competency_name}</span><span>{item.percentage}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500" style={{ width: `${Math.max(0, Math.min(100, Number(item.percentage)))}%` }} /></div><p className="mt-1 text-xs text-slate-500">{item.explanation}</p></div>)}</div> : employerLed && evaluation.evaluator_rating ? <div className="grid gap-4 sm:grid-cols-2">{([
          [text("Safety Awareness", "الوعي بالسلامة"), evaluation.evaluator_rating.safety_awareness],
          [text("Hygiene & Standards", "النظافة والمعايير"), evaluation.evaluator_rating.hygiene],
          [text("Communication Ability", "القدرة على التواصل"), evaluation.evaluator_rating.communication],
          [text("Practical Task Execution", "تنفيذ المهام العملية"), evaluation.evaluator_rating.task_execution],
          [text("Behavioral Indicators", "المؤشرات السلوكية"), evaluation.evaluator_rating.behavioral_risk_level],
          [text("Consistency", "الاتساق"), evaluation.evaluator_rating.consistency],
        ] as [string, string | number | null][]).map(([label, value]) => <div key={label} className="rounded-lg border border-sky-100 p-4"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-lg font-semibold">{value ?? "—"}</p></div>)}</div> : <p className="text-sm text-slate-500">{text("Competency results are not available for this assessment.", "نتائج الكفاءات غير متاحة لهذا التقييم.")}</p>}</section>}
      {tab === "history" && <section className={panel}><h2 className="bg-sky-50/70 p-4 font-bold">{text("Document versions & audit trail", "إصدارات المستندات وسجل التدقيق")}</h2><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{[text("Version / document", "الإصدار / المستند"), text("Change / status", "التغيير / الحالة"), text("Recorded", "التاريخ"), text("Recorded by", "سجله")].map(label => <th key={label} className="p-3 text-start">{label}</th>)}</tr></thead><tbody>{data.reports.map(item => <tr key={item.id} className="border-t border-sky-100"><td className="p-3">{item.report_number} · {item.report_version}</td><td className="p-3">{item.report_status}</td><td className="p-3">{assessmentDate(item.generated_at, locale)}</td><td className="p-3">{item.generated_by_name || "—"}</td></tr>)}{data.corrections.map((item, index) => <tr key={index} className="border-t border-sky-100"><td className="p-3">v{index + 2}</td><td className="p-3">{item.reason}</td><td className="p-3">{assessmentDate(item.created_at, locale)}</td><td className="p-3">{item.recorded_by || "—"}</td></tr>)}</tbody></table>{!data.reports.length && !data.corrections.length && <p className="p-4 text-sm text-slate-500">{text("No document versions or corrections recorded yet.", "لم تُسجل إصدارات أو تصحيحات بعد.")}</p>}</div><p className="bg-blue-50 p-3 text-xs text-blue-800">{text("Final submissions are locked. Authorized corrections create audited versions.", "التقديمات النهائية مقفلة. تُنشئ التصحيحات المصرح بها إصدارات مدققة.")}</p></section>}
      </div>
      <section className={`${panel} flex items-start gap-3 p-4`}><Settings className="h-6 w-6 shrink-0" /><div><h2 className="text-sm font-bold">{text("Assessment method", "طريقة التقييم")}</h2><p className="mt-1 text-xs text-slate-600">{employerLed ? text("Employer-led: evaluator ratings and comments; transcript only if dialogue was recorded or captured.", "بقيادة صاحب العمل: تقييمات وتعليقات المقيّم؛ النص متاح فقط عند تسجيل الحوار.") : text("AI-assisted: recorded responses and rule-based analysis.", "بمساعدة الذكاء الاصطناعي: إجابات مسجلة وتحليل قائم على القواعد.")}</p></div></section>
      <details className={panel}><summary className="cursor-pointer bg-sky-50/70 p-4 text-sm font-bold"><Clock className="me-2 inline h-5 w-5" />{text("Previous assessments — open separately", "التقييمات السابقة — تُفتح منفصلة")}</summary><p className="px-4 pt-3 text-xs text-slate-500">{text("Each assessment retains its own role, date and document versions.", "يحتفظ كل تقييم بدوره وتاريخه وإصدارات مستنداته.")}</p><div className="space-y-2 p-4">{items.filter(item => item.candidate === evaluation.candidate && item.id !== evaluation.id).map(item => <button key={item.id} className={`${outlineButton} block w-full text-start`} onClick={() => open(item.id)}>{item.candidate_job_role || evaluation.candidate_job_role} · {assessmentDate(item.completed_at || item.scheduled_date, locale)} · {method(item.assessment_mode === "SCHEDULED_INTERVIEW", item.evaluation_tier)}</button>)}{!items.some(item => item.candidate === evaluation.candidate && item.id !== evaluation.id) && <p className="text-sm text-slate-500">{text("No other assessments.", "لا توجد تقييمات أخرى.")}</p>}</div></details>
    </> : null}
    <footer className="grid gap-4 border-t border-sky-100 py-5 text-sm md:grid-cols-3">{[[text("Interview Transcript", "نص المقابلة"), text("What happened in the interview", "ما حدث في المقابلة")], [text("Assessment Analysis Report", "تقرير تحليل التقييم"), text("What the evidence and scores mean", "ما تعنيه الأدلة والدرجات")], [text("Readiness Certificate", "شهادة الجاهزية"), text("Eligibility-controlled certification", "شهادة خاضعة لشروط الأهلية")]].map(([title, description]) => <div key={title}><p className="font-bold">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div>)}</footer>
    <p className="rounded-lg bg-blue-950 px-4 py-3 text-center text-xs text-blue-50">{text("Final submissions locked. Authorized corrections create audited versions. Screening uses its approved preliminary outcome and does not issue a readiness certificate. Existing assessment rules remain unchanged.", "التقديمات النهائية مقفلة. تُنشئ التصحيحات المصرح بها إصدارات مدققة. يستخدم الفحص الأولي النتيجة المبدئية المعتمدة ولا يصدر شهادة جاهزية. تبقى قواعد التقييم الحالية دون تغيير.")}</p>
  </div></main>;
}
