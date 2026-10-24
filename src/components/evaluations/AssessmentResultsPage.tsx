"use client";

import { useEffect, useState, type ComponentType } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertTriangle, ArrowLeft, ArrowRight, Award, BarChart3, CheckCircle2, ChevronRight, Clock, FileText, Info, Loader2 } from "lucide-react";
import evaluationService, { type AssessmentResultsData } from "@/app/api/evaluations/endpoints";
import candidateService from "@/app/api/candidates/endpoints";
import reportService from "@/app/api/reports/endpoints";
import type { Candidate } from "@/app/api/candidates/types";
import type { EvaluationListItem } from "@/app/api/evaluations/types";
import { apiErrorMessage } from "@/lib/api-error-message";
import { COMPETENCIES, ScheduledModeBadge, ScheduledStepper, useCompetencyText, useLanguageName } from "@/components/scheduled/scheduled-ui";
import { AssessmentFilters, AssessmentType, CandidateIdentity, hasAssessmentResult, assessmentDate, localDate, outlineButton, panel, primaryButton, useAssessmentText } from "./assessment-ui";

// Approved default competency pass mark (management decision 5, 20 Oct 2026).
const PASS_MARK = 60;

type Tab = "overview" | "competencies" | "documents" | "history";
export function AssessmentResultsPage({ scope }: { scope: "business" | "indivisual" }) {
  const text = useAssessmentText();
  const locale = useLocale();
  const router = useRouter();
  const params = useSearchParams();
  const competencyText = useCompetencyText();
  const languageName = useLanguageName();
  const selected = params.get("assessment");
  const [items, setItems] = useState<EvaluationListItem[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [data, setData] = useState<AssessmentResultsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("overview");
  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [correction, setCorrection] = useState<{ open: boolean; notes: string; notice: string }>({ open: false, notes: "", notice: "" });
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
    setData(null); setShowTranscript(false); setTab("overview"); setError(""); setCorrection({ open: false, notes: "", notice: "" });
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
  const readinessCode = evaluation?.readiness_status || report?.readiness_status || "PENDING";
  const ready = screening ? text("Preliminary outcome", "نتيجة أولية") : ({ READY: text("Ready", "جاهز"), PARTIALLY_READY: text("Partially Ready", "جاهز جزئيًا"), NOT_READY: text("Not Ready", "غير جاهز"), INCOMPLETE: text("Insufficient evidence", "أدلة غير كافية"), PENDING: text("Pending", "قيد الانتظار") } as Record<string, string>)[readinessCode] || text("Pending", "قيد الانتظار");
  const readinessSummary = screening ? text("Screening gives a preliminary outcome only.", "يقدم الفحص الأولي نتيجة مبدئية فقط.") : ({
    READY: text("Evidence supports the role requirements.", "تدعم الأدلة متطلبات الدور."),
    PARTIALLY_READY: text("Evidence supports several role requirements. Specific gaps require follow-up.", "تدعم الأدلة عدة متطلبات للدور. تتطلب فجوات محددة متابعة."),
    NOT_READY: text("Evidence does not yet meet the role requirements. Training and re-assessment are recommended.", "لا تستوفي الأدلة متطلبات الدور بعد. يُنصح بالتدريب وإعادة التقييم."),
    INCOMPLETE: text("Not enough evidence to determine readiness.", "لا تتوفر أدلة كافية لتحديد الجاهزية."),
  } as Record<string, string>)[readinessCode] || text("The outcome is not available yet.", "النتيجة غير متاحة بعد.");
  const readinessStyle = ({ READY: "border-emerald-100 bg-emerald-50/70 text-emerald-800", PARTIALLY_READY: "border-amber-100 bg-amber-50/70 text-amber-800", NOT_READY: "border-red-100 bg-red-50/70 text-red-800" } as Record<string, string>)[readinessCode] || "border-blue-100 bg-blue-50/70 text-blue-800";
  const validCertificate = evaluation?.certificate_status === "ISSUED" && evaluation.certificate_enabled !== false && !screening && !!evaluation.certificate_url;
  const certificateLabel = validCertificate ? text("Available", "متاحة") : evaluation?.certificate_status === "PENDING" ? text("Pending", "قيد الانتظار") : evaluation?.certificate_status === "REVOKED" ? text("Revoked", "ملغاة") : evaluation?.certificate_status === "EXPIRED" ? text("Expired", "منتهية") : text("Not eligible / not issued", "غير مؤهل / لم تصدر");
  const conversation = data?.conversation ?? [];
  const useConversation = employerLed && conversation.length > 0;
  const transcriptAvailable = useConversation || !!data?.transcript.length;
  const eligibilityReason = ({
    VERIFICATION_FAILED: text("Candidate identity verification is required.", "يجب التحقق من هوية المرشح."),
    CONSENT_REQUIRED: text("Signed candidate consent is required.", "تلزم موافقة المرشح الموقعة."),
    SCREENING_NO_CERTIFICATE: text("Screening assessments do not issue a readiness certificate.", "لا تصدر شهادة جاهزية للفحص الأولي."),
    CERTIFICATE_DISABLED: text("Certificate issuance is disabled for this assessment.", "إصدار الشهادة معطل لهذا التقييم."),
    COMPLETION_UNVERIFIED: text("Finalize the evaluator-rated assessment to check certificate eligibility.", "أكمل التقييم للتحقق من أهلية الشهادة."),
    EVALUATOR_RATING_PENDING: text("Final evaluator ratings are required.", "تلزم تقييمات المقيّم النهائية."),
    INCOMPLETE: text("Complete assessment evidence is required.", "تلزم أدلة تقييم مكتملة."),
    HUMAN_REVIEW_PENDING: text("An authorized review must be completed first.", "يجب إكمال المراجعة المصرح بها أولاً."),
    NOT_READY: text("A Not Ready outcome does not receive a readiness certificate.", "لا تصدر شهادة جاهزية لنتيجة غير جاهز."),
    REQUIRED_COMPETENCY_BELOW_THRESHOLD: text("A required competency is below its pass mark.", "كفاءة مطلوبة دون درجة النجاح."),
    QUALITY_BELOW_THRESHOLD: text("The captured evidence does not meet the minimum quality.", "الأدلة المسجلة لا تستوفي الحد الأدنى للجودة."),
  } as Record<string, string>)[data?.certificate_eligibility?.reason || ""];
  const reviewBlocked = data?.certificate_eligibility?.reason === "HUMAN_REVIEW_PENDING";
  async function finalizeScheduled() {
    if (!selected) return;
    await documentAction(async () => {
      await evaluationService.finalizeScheduledAssessment(selected);
      setData(await evaluationService.getAssessmentResults(selected));
      setItems((await evaluationService.getEvaluations()).filter(hasAssessmentResult));
    });
  }
  async function requestCorrection() {
    if (!selected || !correction.notes.trim()) return;
    setDocumentBusy(true);
    try {
      await evaluationService.recordScheduledException(selected, "request_correction", correction.notes.trim());
      setCorrection({ open: false, notes: "", notice: text("Correction request recorded.", "تم تسجيل طلب التصحيح.") });
    } catch (error) { setCorrection(value => ({ ...value, notice: apiErrorMessage(error) || text("Unable to record the request. Please retry.", "تعذر تسجيل الطلب. يرجى إعادة المحاولة.") })); }
    finally { setDocumentBusy(false); }
  }
  async function documentAction(action: () => Promise<void>) { setDocumentBusy(true); setError(""); try { await action(); } catch (error) { setError(apiErrorMessage(error) || text("Unable to open document. Please retry.", "تعذر فتح المستند. يرجى إعادة المحاولة.")); } finally { setDocumentBusy(false); } }
  const speaker = (role: string) => role === "CANDIDATE" ? text("Candidate", "المرشح") : text("Evaluator", "المقيّم");
  function transcriptDownload() {
    if (!data || !evaluation) return;
    const heading = [`${text("Interview Transcript", "نص المقابلة")} — ${evaluation.candidate_first_name} ${evaluation.candidate_last_name}`, evaluation.id];
    const body = useConversation
      ? conversation.map((item, index) => `${index + 1}. ${speaker(item.speaker_role)} · ${new Date(item.sent_at).toLocaleString(locale)}${item.input_mode === "TEXT" ? ` · ${text("typed", "مكتوب")}` : ""}\n${text("Original", "الأصل")} (${languageName(item.source_language)}): ${item.original_text}\n${text("Translation", "الترجمة")} (${languageName(item.target_language)}): ${item.translated_text || text("Not available", "غير متاحة")}`)
      : data.transcript.map((item, index) => `${index + 1}. ${item.question}\n${item.responses.length ? item.responses.map(response => `${text("Original", "الأصل")} (${response.language || evaluation.candidate_preferred_language}): ${response.original || text("Missing / unclear", "مفقود / غير واضح")}${response.translation ? `\n${text("Translation", "الترجمة")} (${response.translation_language}): ${response.translation}` : ""}`).join("\n") : text("Unanswered", "لم تتم الإجابة")}`);
    const url = URL.createObjectURL(new Blob([[...heading, ...body].join("\n\n")], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `${evaluation.id}-interview-transcript.txt`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  const viewReport = () => { if (report) void documentAction(() => (employerLed ? reportService.viewPdf(report.id) : reportService.viewAiAnalysisPdf(report.id))); };
  const downloadReport = () => { if (report) void documentAction(() => (employerLed ? reportService.downloadPdf(report.id, `${report.report_number}-assessment-analysis.pdf`) : reportService.downloadAiAnalysisPdf(report.id, `${report.report_number}-assessment-analysis.pdf`))); };
  const viewCertificate = () => { if (validCertificate) window.open(evaluation!.certificate_url, "_blank", "noopener,noreferrer"); };
  const downloadCertificate = () => { if (validCertificate) { const link = document.createElement("a"); link.href = evaluation!.certificate_url!; link.download = `${evaluation!.id}-readiness-certificate.pdf`; link.target = "_blank"; link.rel = "noopener noreferrer"; link.click(); } };
  const rating = evaluation?.evaluator_rating;
  const competencyRows = employerLed && rating ? COMPETENCIES.map(item => {
    const value = rating[item.key] as number | null | undefined;
    const behavioral = item.key === "behavior_integrity";
    const status = behavioral
      ? { label: ({ Low: text("Low risk", "خطر منخفض"), Medium: text("Medium risk", "خطر متوسط"), High: text("High risk", "خطر مرتفع") } as Record<string, string>)[rating.behavioral_risk_level] || text("Not assessed", "لم يُقيَّم"), tone: rating.behavioral_risk_level === "Low" ? "good" : rating.behavioral_risk_level === "High" ? "bad" : "warn" }
      : value === null || value === undefined ? { label: text("Not assessed", "لم يُقيَّم"), tone: "muted" }
      : value >= PASS_MARK ? { label: text("Meets", "يستوفي"), tone: "good" } : { label: text("Below pass mark", "دون درجة النجاح"), tone: "warn" };
    return { key: item.key, label: competencyText.label(item), value: behavioral ? null : value, status, note: rating.competency_notes?.[item.key], evidence: rating.competency_evidence?.[item.key]?.length ?? 0 };
  }) : [];
  const toneClass: Record<string, string> = { good: "bg-emerald-100 text-emerald-800", warn: "bg-amber-100 text-amber-800", bad: "bg-red-100 text-red-800", muted: "bg-slate-100 text-slate-600" };
  function DocumentRow({ icon: Icon, tone, title, description, available, status, onView, onDownload, note }: { icon: ComponentType<{ className?: string }>; tone: string; title: string; description: string; available: boolean; status?: string; onView: () => void; onDownload: () => void; note?: string }) {
    return <div className="border-t border-sky-100 p-4 first:border-t-0"><div className="flex flex-wrap items-center gap-4"><span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="h-6 w-6" /></span><div className="min-w-[180px] flex-1"><h3 className="font-semibold text-slate-900">{title}</h3><p className="text-xs text-slate-500">{description}</p>{status && <p className={`mt-1 text-xs ${available ? "text-emerald-700" : "text-amber-700"}`}>{status}</p>}</div><div className="flex gap-2"><button className={outlineButton} disabled={!available || documentBusy} onClick={onView}>{text("View", "عرض")}</button><button className={primaryButton} disabled={!available || documentBusy} onClick={onDownload}>{text("Download", "تنزيل")}</button></div></div>{note && <p className="mt-3 flex items-start gap-2 rounded-lg bg-blue-50 p-3 text-xs text-blue-800"><Info className="h-4 w-4 shrink-0" />{note}</p>}</div>;
  }
  const documentRows = evaluation ? <>
    <DocumentRow icon={FileText} tone="bg-blue-50 text-blue-600" title={text("Interview Transcript", "نص المقابلة")} available={transcriptAvailable} status={transcriptAvailable ? undefined : text("No captured dialogue", "لا يوجد حوار مسجل")} description={text("Captured conversation, originals and translations", "المحادثة المسجلة والنصوص الأصلية والترجمات")} onView={() => setShowTranscript(value => !value)} onDownload={transcriptDownload} />
    {showTranscript && <div className="max-h-[500px] space-y-4 overflow-auto border-t bg-slate-50 p-5">{useConversation ? conversation.map((item, index) => <article key={item.id} className="text-sm"><p className="text-xs text-slate-500">{index + 1}. {speaker(item.speaker_role)} · {new Date(item.sent_at).toLocaleString(locale)}{item.input_mode === "TEXT" && ` · ${text("typed", "مكتوب")}`}</p><p className="mt-1 text-xs text-slate-500">{text("Original", "الأصل")} · {languageName(item.source_language)}</p><p className="whitespace-pre-wrap">{item.original_text}</p><p className="mt-2 text-xs text-slate-500">{text("Translation", "الترجمة")} · {languageName(item.target_language)}</p><p className="whitespace-pre-wrap">{item.translated_text || text("Not available", "غير متاحة")}</p></article>) : data!.transcript.map((item, index) => <article key={index}><h3 className="font-semibold">{index + 1}. {item.question}</h3>{item.responses.length ? item.responses.map((response, responseIndex) => <div key={responseIndex} className="mt-2 whitespace-pre-wrap text-sm"><p className="text-xs text-slate-500">{text("Original", "الأصل")} · {response.language || evaluation.candidate_preferred_language}</p><p>{response.original || text("Missing / unclear", "مفقود / غير واضح")}</p>{response.translation && <><p className="mt-2 text-xs text-slate-500">{text("Translation", "الترجمة")} · {response.translation_language}</p><p>{response.translation}</p></>}</div>) : <p className="text-sm text-slate-500">{text("Unanswered", "لم تتم الإجابة")}</p>}</article>)}</div>}
    <DocumentRow icon={BarChart3} tone="bg-violet-50 text-violet-600" title={text("Assessment Analysis Report", "تقرير تحليل التقييم")} available={!!report} status={report ? undefined : text("Not available yet", "غير متاح بعد")} description={employerLed ? text("Evaluator ratings, evidence and gaps", "تقييمات المقيّم والأدلة والفجوات") : text("Performance analysis, competency scores and assessment gaps", "تحليل الأداء ودرجات الكفاءة وفجوات التقييم")} onView={viewReport} onDownload={downloadReport} />
    <DocumentRow icon={Award} tone="bg-amber-50 text-amber-600" title={text("Readiness Certificate", "شهادة الجاهزية")} available={validCertificate} status={validCertificate ? undefined : `${certificateLabel}${eligibilityReason ? ` · ${text("Eligibility reason", "سبب الأهلية")}: ${eligibilityReason}` : ""}`} description={text("Issued only when approved certificate requirements are met.", "تصدر فقط عند استيفاء متطلبات الشهادة المعتمدة.")} onView={viewCertificate} onDownload={downloadCertificate} />
  </> : null;
  return <main className="min-h-screen bg-linear-to-br from-sky-50/70 via-white to-violet-50/40 p-4 text-blue-950 md:p-7"><div className="mx-auto max-w-7xl space-y-4">
    {selected && <button className="flex items-center gap-2 text-sm text-blue-700" onClick={() => open()}><ArrowLeft className="h-4 w-4 rtl:rotate-180" />{text("Back to results list", "العودة إلى قائمة النتائج")}</button>}
    {!selected && <header className="flex flex-wrap items-end justify-between gap-2"><h1 className="text-3xl font-bold tracking-tight">{text("Assessment Results", "نتائج التقييم")}</h1><p className="text-xs text-slate-500">{text("One page per assessment · Also opened from Evaluations.", "صفحة لكل تقييم · تُفتح أيضًا من التقييمات.")}</p></header>}
    {!selected && <section className={panel}><h2 className="bg-sky-50/70 px-4 py-2 text-sm font-semibold">{text("Assessment Results list — search & date filters", "قائمة نتائج التقييم — البحث وفلاتر التاريخ")}</h2><div className="p-4"><AssessmentFilters search={search} onSearch={setSearch} from={from} to={to} onDates={(a, b) => { setFrom(a); setTo(b); }} />{(search || from || to) && <button className="mt-3 text-xs text-blue-700 underline" onClick={() => { setSearch(""); setFrom(""); setTo(""); }}>{text("Clear filters", "مسح الفلاتر")}</button>}</div></section>}
    {error && <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{error} <button className="underline" onClick={() => setAttempt(value => value + 1)}>{text("Retry", "إعادة المحاولة")}</button></p>}
    {loading || loadingDetail ? <div role="status" className="p-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" /><p className="mt-3 text-sm">{text("Loading assessment results…", "جار تحميل نتائج التقييم…")}</p></div> : !selected ? <section className={panel}><div className="overflow-x-auto"><table className="w-full min-w-[800px] text-sm"><thead className="bg-sky-50/70"><tr>{[text("Candidate / Role", "المرشح / الدور"), text("Method", "الطريقة"), text("Type", "النوع"), text("Assessment date", "تاريخ التقييم"), text("Actions", "الإجراءات")].map(label => <th key={label} className="p-4 text-start">{label}</th>)}</tr></thead><tbody>{filtered.map(item => <tr key={item.id} className="border-t border-sky-100"><td className="p-4"><CandidateIdentity name={item.candidate_name} candidate={personFor(item.candidate)} role={item.candidate_job_role} /></td><td className="p-4">{method(item.assessment_mode === "SCHEDULED_INTERVIEW", item.evaluation_tier)}</td><td className="p-4"><AssessmentType mode={item.assessment_mode} /></td><td className="p-4">{assessmentDate(item.completed_at || item.scheduled_date, locale)}</td><td className="p-4"><button className={primaryButton} onClick={() => open(item.id)}>{text("View result", "عرض النتيجة")}</button></td></tr>)}{filtered.length === 0 && <tr><td colSpan={5} className="p-10 text-center text-slate-500">{text("No completed assessments match these filters.", "لا توجد تقييمات مكتملة تطابق الفلاتر.")}</td></tr>}</tbody></table></div></section> : evaluation && data ? <>
      {employerLed && <div className="flex justify-center"><ScheduledStepper stage="results" /></div>}
      <header>
        <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight">{text("Assessment Result", "نتيجة التقييم")}</h1>{employerLed ? <ScheduledModeBadge className="border-violet-200 bg-violet-50 text-violet-800" /> : <AssessmentType mode={evaluation.assessment_mode} />}</div>
        <p className="mt-1 text-sm text-slate-600">{text("Review the assessment outcome, supporting documents and next steps.", "راجع نتيجة التقييم والمستندات الداعمة والخطوات التالية.")}</p>
      </header>
      <section className={`${panel} flex flex-wrap items-center gap-6 p-5`}>
        <div className="flex items-center gap-4">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-violet-100 text-xl font-bold text-violet-700">{evaluation.candidate_details?.profile_photo ? <img src={evaluation.candidate_details.profile_photo} alt="" className="h-full w-full object-cover" /> : `${evaluation.candidate_first_name?.[0] ?? ""}${evaluation.candidate_last_name?.[0] ?? ""}`}</div>
          <div><p className="text-xl font-bold text-slate-950">{evaluation.candidate_first_name} {evaluation.candidate_last_name}</p><p className="text-sm text-slate-500">{evaluation.candidate_job_role || evaluation.candidate_details?.job_role || "—"}</p><p className="mt-1 text-xs text-slate-500">{text("Assessment ID", "معرف التقييم")} <span className="break-all font-medium text-slate-700">{evaluation.id}</span></p></div>
        </div>
        <dl className="grid flex-1 gap-x-6 gap-y-2 border-s border-sky-100 ps-6 text-sm sm:grid-cols-[auto_1fr]">
          {[[text("Assessment type", "نوع التقييم"), method(!!employerLed, evaluation.evaluation_tier)], [employerLed ? text("Scheduled by", "جدوله") : text("Started by", "بدأه"), evaluation.created_by_name || "—"], [text("Completed on", "اكتمل في"), evaluation.completed_at ? new Date(evaluation.completed_at).toLocaleString(locale, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : assessmentDate(evaluation.scheduled_date, locale)], [text("Language", "اللغة"), evaluation.candidate_preferred_language]].map(([label, value]) => <div key={label} className="contents"><dt className="text-slate-500">{label}</dt><dd className="font-medium text-slate-900">{value}</dd></div>)}
        </dl>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatusCard icon={CheckCircle2} style="border-emerald-100 bg-emerald-50/70 text-emerald-800" label={text("Completion", "الإكمال")} value={text("Completed", "مكتمل")} detail={employerLed ? text("Interview session completed and submitted.", "اكتملت جلسة المقابلة وتم إرسالها.") : text("Assessment completed.", "اكتمل التقييم.")} />
        <StatusCard icon={screening ? FileText : AlertTriangle} style={readinessStyle} label={screening ? text("Screening outcome", "نتيجة الفحص الأولي") : text("Readiness", "الجاهزية")} value={ready} detail={readinessSummary} />
        <StatusCard icon={Info} style="border-blue-100 bg-blue-50/70 text-blue-800" label={text("Review", "المراجعة")} value={reviewBlocked ? text("Review pending", "المراجعة معلقة") : text("No blocking exception", "لا يوجد استثناء مانع")} detail={reviewBlocked ? text("An authorized review must be completed first.", "يجب إكمال المراجعة المصرح بها أولاً.") : text("No policy or integrity issues that prevent progression.", "لا توجد مشكلات سياسة أو نزاهة تمنع التقدم.")} />
        <StatusCard icon={Award} style={validCertificate ? "border-emerald-100 bg-emerald-50/70 text-emerald-800" : "border-red-100 bg-red-50/60 text-red-800"} label={text("Certificate", "الشهادة")} value={validCertificate ? text("Issued", "صادرة") : text("Not issued", "لم تصدر")} detail={validCertificate ? text("Available under Documents.", "متاحة ضمن المستندات.") : eligibilityReason || certificateLabel} action={!validCertificate ? <button className="text-xs font-semibold underline" onClick={() => setTab("documents")}>{text("View eligibility reason", "عرض سبب الأهلية")}</button> : undefined} />
      </div>
      {employerLed && !validCertificate && data.can_finalize && evaluation.certificate_enabled !== false && !screening && <section className={`${panel} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <p className="text-sm text-slate-600">{data.certificate_eligibility?.eligible ? text("This assessment is eligible. Generate its certificate.", "هذا التقييم مؤهل. أنشئ شهادته.") : text("If the assessment was not finalized, finalize it to check certificate eligibility.", "إذا لم يكتمل التقييم، أكمله للتحقق من أهلية الشهادة.")}</p>
        <button className={primaryButton} disabled={documentBusy} onClick={finalizeScheduled}>{documentBusy ? text("Checking eligibility…", "جار التحقق من الأهلية…") : text("Finalize & generate certificate", "إكمال التقييم وإنشاء الشهادة")}</button>
      </section>}
      <section className={panel}>
        <nav aria-label={text("Assessment result tabs", "تبويبات نتيجة التقييم")} className="flex overflow-x-auto border-b border-sky-100 px-2" role="tablist">{([['overview', text("Overview", "نظرة عامة")], ['competencies', text("Competencies", "الكفاءات")], ['documents', text("Documents", "المستندات")], ['history', text("History", "السجل")]] as [Tab, string][]).map(([key, label]) => <button key={key} id={`tab-${key}`} aria-controls={`panel-${key}`} role="tab" aria-selected={tab === key} onClick={() => setTab(key)} className={`border-b-2 px-5 py-3 text-sm ${tab === key ? "border-blue-600 font-semibold text-blue-700" : "border-transparent text-slate-500"}`}>{label}</button>)}</nav>
        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-5">
        {tab === "overview" && <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-5">
            <div><h2 className="mb-3 font-semibold">{text("Main Summary", "الملخص الرئيسي")}</h2><div className="flex gap-4 rounded-xl bg-sky-50/80 p-4"><span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-blue-600"><FileText className="h-6 w-6" /></span><div><p className="font-semibold text-slate-900">{readinessSummary}</p>{!screening && evaluation.score !== undefined && evaluation.score !== null && <p className="mt-1 text-sm text-slate-600">{text("Overall score", "الدرجة الإجمالية")}: <b>{evaluation.score}%</b></p>}<p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{evaluation.feedback || report?.readiness_reason || ""}</p></div></div></div>
            <div><h2 className="mb-3 font-semibold">{text("Assessment Documents", "مستندات التقييم")}</h2><div className="rounded-xl border border-sky-100">{documentRows}</div></div>
          </div>
          <div className="space-y-5">
            <div><div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">{text("Competency Summary", "ملخص الكفاءات")}</h2><button className="flex items-center gap-1 text-sm font-medium text-blue-700" onClick={() => setTab("competencies")}>{text("View supporting evidence", "عرض الأدلة الداعمة")}<ArrowRight className="h-4 w-4 rtl:rotate-180" /></button></div>
              <ul className="rounded-xl border border-sky-100">{competencyRows.length ? competencyRows.map(row => <li key={row.key}><button className="flex w-full items-center gap-3 border-t border-sky-100 px-4 py-3 text-start text-sm first:border-t-0 hover:bg-slate-50" onClick={() => setTab("competencies")}><span className="flex-1 text-slate-800">{row.label}</span>{row.value !== null && row.value !== undefined && <span className="text-xs text-slate-500">{row.value}</span>}<span className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClass[row.status.tone]}`}>{row.status.label}</span><ChevronRight className="h-4 w-4 text-slate-400 rtl:rotate-180" /></button></li>)
                : Array.isArray(report?.competency_breakdown) && report.competency_breakdown.length ? report.competency_breakdown.map(item => <li key={item.competency_code} className="flex items-center gap-3 border-t border-sky-100 px-4 py-3 text-sm first:border-t-0"><span className="flex-1">{item.competency_name}</span><span className="font-medium">{item.percentage}%</span></li>)
                : <li className="p-4 text-sm text-slate-500">{text("Competency results are not available for this assessment.", "نتائج الكفاءات غير متاحة لهذا التقييم.")}</li>}</ul>
              {rating?.critical_safety_failure && <p className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800"><b>{text("Confirmed critical safety failure", "إخفاق حرج مؤكد في السلامة")}:</b> {rating.critical_safety_failure_note}</p>}
            </div>
            {employerLed && rating && <div><h2 className="mb-2 font-semibold">{text("Evaluator Submission", "إرسال المقيّم")}</h2><p className="text-xs text-slate-500">{text("Submitted by", "أرسله")} {rating.rated_by_name || "—"} • {text("Version", "الإصدار")} {1 + data.corrections.length}</p>
              <div className="mt-2 flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-slate-50/60 p-3"><p className="flex-1 text-xs text-slate-600">{text("Ratings and assessment outcome have been submitted and locked.", "تم إرسال التقييمات ونتيجة التقييم وقفلها.")} {data.can_manage_exceptions ? text("You can request a correction if you believe there is an error.", "يمكنك طلب تصحيح إذا كنت تعتقد بوجود خطأ.") : text("Contact your administrator if a correction is needed.", "تواصل مع المسؤول إذا لزم تصحيح.")}</p>{data.can_manage_exceptions && <button className={outlineButton} onClick={() => setCorrection(value => ({ ...value, open: !value.open, notice: "" }))}>{text("Request correction", "طلب تصحيح")}</button>}</div>
              {correction.open && <div className="mt-2 space-y-2"><textarea aria-label={text("Correction reason", "سبب التصحيح")} value={correction.notes} onChange={event => setCorrection(value => ({ ...value, notes: event.target.value }))} maxLength={10000} rows={3} className="w-full rounded-lg border border-slate-300 p-3 text-sm" placeholder={text("What needs correcting, and why.", "ما الذي يحتاج إلى تصحيح ولماذا.")} /><button className={primaryButton} disabled={documentBusy || !correction.notes.trim()} onClick={requestCorrection}>{text("Record request", "تسجيل الطلب")}</button><p className="text-xs text-amber-800">{text("No manual Ready / Not Ready override. Corrections go through the authorized correction workflow and recalculation.", "لا يمكن تجاوز الجاهزية يدويًا. تتم التصحيحات عبر سير التصحيح المصرح به وإعادة الحساب.")}</p></div>}
              {correction.notice && <p role="status" className="mt-2 text-xs text-slate-700">{correction.notice}</p>}
            </div>}
          </div>
        </div>}
        {tab === "documents" && <div className="rounded-xl border border-sky-100">{documentRows}<p className="border-t border-sky-100 p-4 text-xs text-slate-500">{text("Available regardless of pass / fail when recorded or captured text exists. Missing or unclear sections are marked; dialogue is never invented. Original-language text is retained and translations are clearly labelled.", "متاح بغض النظر عن النجاح أو الإخفاق عند وجود نص مسجل. تُحدد الأجزاء المفقودة أو غير الواضحة ولا يُختلق الحوار. يُحتفظ بالنص الأصلي وتُميز الترجمات بوضوح.")}</p></div>}
        {tab === "competencies" && (competencyRows.length ? <div className="space-y-3">{competencyRows.map(row => <div key={row.key} className="rounded-xl border border-sky-100 p-4"><div className="flex flex-wrap items-center gap-3"><h3 className="flex-1 font-semibold">{row.label}</h3>{row.value !== null && row.value !== undefined && <span className="text-sm text-slate-600">{row.value}/100</span>}<span className={`rounded-md px-2 py-0.5 text-xs font-medium ${toneClass[row.status.tone]}`}>{row.status.label}</span></div><p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{row.note || <span className="text-slate-400">{text("No evidence note recorded.", "لا يوجد وصف للدليل.")}</span>}</p><p className="mt-1 text-xs text-slate-500">{text("Linked conversation entries", "مداخلات المحادثة المرتبطة")}: {row.evidence}</p></div>)}<p className="text-xs text-slate-500">{text(`Ratings use the approved 0–100 scale; ${PASS_MARK} is the default pass mark. Behavioral Indicators is shown as a risk level and is not part of the average.`, `تستخدم التقييمات المقياس المعتمد 0–100؛ ودرجة النجاح الافتراضية ${PASS_MARK}. تُعرض المؤشرات السلوكية كمستوى خطر ولا تدخل في المتوسط.`)}</p>{rating?.comments && <div className="rounded-lg bg-sky-50 p-4"><h3 className="font-semibold">{text("Evaluator comments", "تعليقات المقيّم")}</h3><p className="mt-2 whitespace-pre-wrap text-sm">{rating.comments}</p></div>}</div>
          : Array.isArray(report?.competency_breakdown) && report.competency_breakdown.length ? <div className="space-y-4">{report.competency_breakdown.map(item => <div key={item.competency_code}><div className="flex justify-between text-sm"><span>{item.competency_name}</span><span>{item.percentage}%</span></div><div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-linear-to-r from-blue-500 to-violet-500" style={{ width: `${Math.max(0, Math.min(100, Number(item.percentage)))}%` }} /></div><p className="mt-1 text-xs text-slate-500">{item.explanation}</p></div>)}</div>
          : <p className="text-sm text-slate-500">{text("Competency results are not available for this assessment.", "نتائج الكفاءات غير متاحة لهذا التقييم.")}</p>)}
        {tab === "history" && <div><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr>{[text("Version / document", "الإصدار / المستند"), text("Change / status", "التغيير / الحالة"), text("Recorded", "التاريخ"), text("Recorded by", "سجله")].map(label => <th key={label} className="p-3 text-start">{label}</th>)}</tr></thead><tbody>{data.reports.map(item => <tr key={item.id} className="border-t border-sky-100"><td className="p-3">{item.report_number} · {item.report_version}</td><td className="p-3">{item.report_status}</td><td className="p-3">{assessmentDate(item.generated_at, locale)}</td><td className="p-3">{item.generated_by_name || "—"}</td></tr>)}{data.corrections.map((item, index) => <tr key={index} className="border-t border-sky-100"><td className="p-3">v{index + 2}</td><td className="p-3">{item.reason}</td><td className="p-3">{assessmentDate(item.created_at, locale)}</td><td className="p-3">{item.recorded_by || "—"}</td></tr>)}</tbody></table>{!data.reports.length && !data.corrections.length && <p className="p-4 text-sm text-slate-500">{text("No document versions or corrections recorded yet.", "لم تُسجل إصدارات أو تصحيحات بعد.")}</p>}</div><p className="mt-3 rounded-lg bg-blue-50 p-3 text-xs text-blue-800">{text("Final submissions are locked. Authorized corrections create audited versions.", "التقديمات النهائية مقفلة. تُنشئ التصحيحات المصرح بها إصدارات مدققة.")}</p></div>}
        </div>
      </section>
      <details className={panel}><summary className="cursor-pointer bg-sky-50/70 p-4 text-sm font-bold"><Clock className="me-2 inline h-5 w-5" />{text("Previous assessments — open separately", "التقييمات السابقة — تُفتح منفصلة")}</summary><p className="px-4 pt-3 text-xs text-slate-500">{text("Each assessment retains its own role, date and document versions.", "يحتفظ كل تقييم بدوره وتاريخه وإصدارات مستنداته.")}</p><div className="space-y-2 p-4">{items.filter(item => item.candidate === evaluation.candidate && item.id !== evaluation.id).map(item => <button key={item.id} className={`${outlineButton} block w-full text-start`} onClick={() => open(item.id)}>{item.candidate_job_role || evaluation.candidate_job_role} · {assessmentDate(item.completed_at || item.scheduled_date, locale)} · {method(item.assessment_mode === "SCHEDULED_INTERVIEW", item.evaluation_tier)}</button>)}{!items.some(item => item.candidate === evaluation.candidate && item.id !== evaluation.id) && <p className="text-sm text-slate-500">{text("No other assessments.", "لا توجد تقييمات أخرى.")}</p>}</div></details>
      <p className="flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-900"><Info className="h-5 w-5 shrink-0 text-blue-600" />{text("Valid reports and captured transcripts remain available independently of certificate eligibility.", "تبقى التقارير الصالحة والنصوص المسجلة متاحة بشكل مستقل عن أهلية الشهادة.")}</p>
    </> : null}
  </div></main>;
}

function StatusCard({ icon: Icon, style, label, value, detail, action }: { icon: ComponentType<{ className?: string }>; style: string; label: string; value: string; detail: string; action?: React.ReactNode }) {
  return <div className={`flex items-start gap-3 rounded-xl border p-4 ${style}`}><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/80"><Icon className="h-6 w-6" /></span><div className="min-w-0"><p className="text-xs font-medium">{label}</p><p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>{action}<p className="mt-1 text-xs text-slate-600">{detail}</p></div></div>;
}
