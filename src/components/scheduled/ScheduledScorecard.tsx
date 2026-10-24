"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { AlertTriangle, CalendarDays, ChevronDown, ChevronRight, FileText, Loader2, Monitor, Save, Send } from "lucide-react";
import evaluationService from "@/app/api/evaluations/endpoints";
import type { Evaluation, EvaluatorRatingPayload, ScorecardCompetency, ScorecardDraftData } from "@/app/api/evaluations/types";
import type { LiveCallGuide, LiveCallSavedSegment } from "@/app/api/live-calls/types";
import { apiErrorMessage } from "@/lib/api-error-message";
import { assessmentDate, useAssessmentText } from "@/components/evaluations/assessment-ui";
import { COMPETENCIES, initials, ScheduledModeBadge, ScheduledStepper, useCompetencyText, useLanguageName } from "./scheduled-ui";

interface Props {
  guide: LiveCallGuide;
  evaluationId: string;
  onSubmitted: () => void;
}

type Draft = Required<Pick<ScorecardDraftData, "ratings" | "notes" | "evidence">> & Omit<ScorecardDraftData, "ratings" | "notes" | "evidence">;

const validRating = (value?: string) => {
  if (value === undefined || value.trim() === "") return false;
  const number = Number(value);
  return Number.isInteger(number) && number >= 0 && number <= 100;
};

// Stage 2: the evaluator rates each approved competency on the approved
// 0-100 scale (level-to-score mapping SCH-05 is not approved, so no levels),
// writes the evidence note (SCH-04) and links the conversation turns that
// support it (SCH-02). Drafts are saved server-side (SCH-07); the final
// submission is locked and the outcome is calculated by the existing rules.
export function ScheduledScorecard({ guide, evaluationId, onSubmitted }: Props) {
  const text = useAssessmentText();
  const locale = useLocale();
  const competencyText = useCompetencyText();
  const languageName = useLanguageName();
  const [evaluation, setEvaluation] = useState<Evaluation | null>(null);
  const [draft, setDraft] = useState<Draft>({ ratings: {}, notes: {}, evidence: {} });
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"save" | "submit" | null>(null);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<ScorecardCompetency>("safety_awareness");
  const [showOther, setShowOther] = useState(false);

  const candidateTurns = useMemo(() => guide.conversation.filter((segment) => segment.speaker_role === "CANDIDATE"), [guide.conversation]);
  const entryNumber = useMemo(() => new Map(guide.conversation.map((segment, index) => [segment.id, index + 1])), [guide.conversation]);
  const questionFor = (segment: LiveCallSavedSegment) =>
    [...guide.conversation].reverse().find((item) => item.speaker_role === "EVALUATOR" && item.sent_at <= segment.sent_at);

  useEffect(() => {
    let active = true;
    Promise.all([
      evaluationService.getEvaluation(evaluationId),
      evaluationService.getEvaluatorRating(evaluationId),
      evaluationService.getScorecardDraft(evaluationId).catch(() => ({ data: {} as ScorecardDraftData, updated_at: null })),
    ]).then(([loaded, rating, saved]) => {
      if (!active) return;
      if (rating) { onSubmitted(); return; }
      setEvaluation(loaded);
      const defaults = Object.fromEntries(COMPETENCIES.map(({ key }) => [
        key, candidateTurns.filter((segment) => segment.competency === key).map((segment) => segment.id),
      ])) as Draft["evidence"];
      setDraft({
        ...saved.data,
        ratings: saved.data.ratings ?? {},
        notes: saved.data.notes ?? {},
        evidence: { ...defaults, ...(saved.data.evidence ?? {}) },
      });
      setSavedAt(saved.updated_at);
    }).catch((err) => { if (active) setError(apiErrorMessage(err) || text("Unable to load the scorecard.", "تعذر تحميل بطاقة التقييم.")); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [evaluationId]);

  function update(patch: Partial<Draft>) { setDraft((current) => ({ ...current, ...patch })); setDirty(true); }
  const isRated = (key: ScorecardCompetency) => validRating(draft.ratings[key]);
  const hasNote = (key: ScorecardCompetency) => !!draft.notes[key]?.trim();
  const complete = (key: ScorecardCompetency) => isRated(key) && hasNote(key);
  const missing = COMPETENCIES.filter(({ key }) => !complete(key));
  const safetyNoteMissing = !!draft.critical_safety_failure && !draft.critical_safety_failure_note?.trim();
  const canSubmit = missing.length === 0 && !safetyNoteMissing;

  async function saveDraft() {
    setBusy("save"); setError("");
    try { const saved = await evaluationService.saveScorecardDraft(evaluationId, draft); setSavedAt(saved.updated_at); setDirty(false); }
    catch (err) { setError(apiErrorMessage(err) || text("Unable to save the draft. Please retry.", "تعذر حفظ المسودة. يرجى إعادة المحاولة.")); }
    finally { setBusy(null); }
  }
  async function submit() {
    if (!canSubmit) return;
    if (!confirm(text("Submit the final evaluation? It is locked after submission; changes then need an authorized correction.", "إرسال التقييم النهائي؟ يُقفل بعد الإرسال وتتطلب التغييرات تصحيحًا مصرحًا به."))) return;
    setBusy("submit"); setError("");
    const payload: EvaluatorRatingPayload = {
      safety_awareness: Number(draft.ratings.safety_awareness),
      hygiene: Number(draft.ratings.hygiene),
      communication: Number(draft.ratings.communication),
      task_execution: Number(draft.ratings.task_execution),
      behavior_integrity: Number(draft.ratings.behavior_integrity),
      comments: draft.comments ?? "",
      critical_safety_failure: !!draft.critical_safety_failure,
      critical_safety_failure_note: draft.critical_safety_failure ? (draft.critical_safety_failure_note ?? "").trim() : "",
      competency_notes: Object.fromEntries(COMPETENCIES.map(({ key }) => [key, (draft.notes[key] ?? "").trim()])),
      competency_evidence: Object.fromEntries(COMPETENCIES.map(({ key }) => [key, draft.evidence[key] ?? []])),
    };
    try { await evaluationService.submitEvaluatorRating(evaluationId, payload); onSubmitted(); }
    catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 409 && (await evaluationService.getEvaluatorRating(evaluationId))) { onSubmitted(); return; }
      setError(apiErrorMessage(err) || text("Unable to submit the evaluation. Please retry.", "تعذر إرسال التقييم. يرجى إعادة المحاولة."));
    } finally { setBusy(null); }
  }

  if (loading) return <div role="status" className="p-16 text-center"><Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-600" /></div>;

  const meta = COMPETENCIES.find((item) => item.key === selected)!;
  const Icon = meta.icon;
  const linked = draft.evidence[selected] ?? [];
  const tagged = candidateTurns.filter((segment) => segment.competency === selected);
  const others = candidateTurns.filter((segment) => segment.competency !== selected);
  const toggleEvidence = (id: string) => update({
    evidence: { ...draft.evidence, [selected]: linked.includes(id) ? linked.filter((item) => item !== id) : [...linked, id] },
  });
  const sessionRef = `SC-${guide.session_id.slice(0, 8).toUpperCase()}`;

  return (
    <div className="space-y-5">
      <ScheduledStepper stage="scorecard" />
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight text-blue-950 md:text-3xl">{text("Evaluation Scorecard", "بطاقة التقييم")}</h1>
        <div className="flex flex-wrap items-center gap-2">
          <ScheduledModeBadge />
          <span className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs text-slate-700">
            <FileText className="h-3.5 w-3.5" />{text("Status: Draft", "الحالة: مسودة")}
            {savedAt && <span className="text-slate-400">· {text("saved", "حُفظت")} {new Date(savedAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}</span>}
          </span>
        </div>
      </header>

      <section className="flex flex-wrap items-center gap-6 rounded-2xl border border-sky-100 bg-white p-4">
        <div className="flex items-center gap-4">
          {guide.candidate.photo_url
            ? <img src={guide.candidate.photo_url} alt="" className="h-16 w-16 rounded-full object-cover" />
            : <span className="flex h-16 w-16 items-center justify-center rounded-full bg-violet-100 text-lg font-bold text-violet-700">{initials(guide.candidate.name)}</span>}
          <div><p className="text-lg font-bold text-slate-900">{guide.candidate.name}</p><p className="text-sm text-slate-500">{guide.role_name}</p></div>
        </div>
        <dl className="grid flex-1 gap-4 sm:grid-cols-3">
          <div className="border-s border-sky-100 ps-4"><dt className="text-xs text-slate-500">{text("Session", "الجلسة")}</dt><dd className="font-semibold" title={guide.session_id}>{sessionRef}</dd></div>
          <div className="flex gap-2 border-s border-sky-100 ps-4"><CalendarDays className="h-5 w-5 text-slate-500" /><div><dt className="text-xs text-slate-500">{text("Scheduled date", "التاريخ المجدول")}</dt><dd className="font-semibold">{assessmentDate(guide.scheduled_start_at || evaluation?.scheduled_date || "", locale)}</dd></div></div>
          <div className="flex gap-2 border-s border-sky-100 ps-4"><Monitor className="h-5 w-5 text-slate-500" /><div><dt className="text-xs text-slate-500">{text("Mode", "النمط")}</dt><dd className="font-semibold">{text("Scheduled", "مجدول")}</dd></div></div>
        </dl>
      </section>

      <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-sky-100 bg-white p-4">
          <h2 className="font-semibold text-slate-900">{text("Applicable competencies", "الكفاءات المطلوبة")}</h2>
          <p className="mt-1 text-xs text-slate-500">{text("Select a competency to review the evidence and rate it.", "اختر كفاءة لمراجعة الأدلة وتقييمها.")}</p>
          <ul className="mt-4 space-y-3">
            {COMPETENCIES.map((item) => {
              const ItemIcon = item.icon;
              const active = item.key === selected;
              const evidence = (draft.evidence[item.key] ?? []).length;
              return (
                <li key={item.key}>
                  <button type="button" onClick={() => { setSelected(item.key); setShowOther(false); }} aria-pressed={active}
                    className={`w-full rounded-xl border p-3 text-start ${active ? "border-blue-400 bg-blue-50/60 ring-1 ring-blue-200" : "border-slate-200 hover:bg-slate-50"}`}>
                    <span className="flex items-center gap-3 font-medium text-slate-900"><ItemIcon className="h-5 w-5" /><span className="flex-1">{competencyText.label(item)}</span><ChevronRight className="h-4 w-4 text-slate-400 rtl:rotate-180" /></span>
                    <span className="mt-2 flex flex-wrap gap-2 text-[11px]">
                      <span className={`rounded-full px-2 py-0.5 ${complete(item.key) ? "bg-emerald-100 text-emerald-800" : isRated(item.key) ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
                        {complete(item.key) ? text(`Rated ${draft.ratings[item.key]}`, `مُقيَّم ${draft.ratings[item.key]}`) : isRated(item.key) ? text("Evidence note needed", "يلزم وصف الدليل") : text("Not rated", "غير مُقيَّم")}
                      </span>
                      <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-800">{text("Evidence", "الأدلة")}: {evidence}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="space-y-4 rounded-2xl border border-sky-100 bg-white p-4 md:p-5">
          <div className="flex items-start gap-3">
            <Icon className="mt-0.5 h-6 w-6 text-blue-700" />
            <div><h2 className="text-lg font-semibold text-slate-900">{competencyText.label(meta)}</h2><p className="mt-1 text-sm text-slate-600">{competencyText.description(meta)}</p></div>
          </div>

          <label className="block rounded-xl border border-slate-200 p-4">
            <span className="text-sm font-semibold text-slate-900">{text("Rating", "التقييم")} <span className="font-normal text-slate-500">(0–100)</span></span>
            <span className="mt-1 block text-xs text-slate-500">{text("Approved scale. The outcome is calculated by the approved rules after submission.", "المقياس المعتمد. تُحسب النتيجة وفق القواعد المعتمدة بعد الإرسال.")}</span>
            <input type="number" inputMode="numeric" min={0} max={100} step={1} value={draft.ratings[selected] ?? ""}
              onChange={(event) => update({ ratings: { ...draft.ratings, [selected]: event.target.value } })}
              aria-invalid={draft.ratings[selected] !== undefined && draft.ratings[selected] !== "" && !isRated(selected)}
              className="mt-3 h-11 w-40 rounded-lg border border-slate-300 px-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500" />
            {draft.ratings[selected] !== undefined && draft.ratings[selected] !== "" && !isRated(selected) && <span className="mt-1 block text-xs text-red-600">{text("Enter a whole number from 0 to 100.", "أدخل رقمًا صحيحًا من 0 إلى 100.")}</span>}
          </label>

          <div className="grid gap-4 xl:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">{text("Supporting evidence", "الأدلة الداعمة")}</h3>
              <div className="mt-2 space-y-2">
                {tagged.length === 0 && <p className="rounded-lg border border-dashed border-slate-200 p-3 text-xs text-slate-500">{text("No candidate responses were filed under this competency during the interview.", "لم تُسجَّل إجابات للمرشح ضمن هذه الكفاءة أثناء المقابلة.")}</p>}
                {tagged.map((segment) => <EvidenceItem key={segment.id} segment={segment} number={entryNumber.get(segment.id) ?? 0} question={questionFor(segment)} checked={linked.includes(segment.id)} onToggle={() => toggleEvidence(segment.id)} languageName={languageName} />)}
                {others.length > 0 && (
                  <button type="button" onClick={() => setShowOther((value) => !value)} className="flex items-center gap-1 text-xs font-medium text-blue-700">
                    <ChevronDown className={`h-3.5 w-3.5 transition ${showOther ? "rotate-180" : ""}`} />{text(`Other candidate responses (${others.length})`, `إجابات أخرى للمرشح (${others.length})`)}
                  </button>
                )}
                {showOther && others.map((segment) => <EvidenceItem key={segment.id} segment={segment} number={entryNumber.get(segment.id) ?? 0} question={questionFor(segment)} checked={linked.includes(segment.id)} onToggle={() => toggleEvidence(segment.id)} languageName={languageName} />)}
              </div>
            </div>
            <label className="block">
              <span className="text-sm font-semibold text-slate-900">{text("Evaluator confirms the evidence", "يؤكد المقيّم الدليل")} <span className="text-red-600">*</span></span>
              <textarea value={draft.notes[selected] ?? ""} maxLength={5000} rows={5}
                onChange={(event) => update({ notes: { ...draft.notes, [selected]: event.target.value } })}
                placeholder={text("What the candidate showed, and any gaps.", "ما أظهره المرشح وأي فجوات.")}
                className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </label>
          </div>

          {selected === "safety_awareness" && (
            <div className="space-y-3 rounded-xl border border-red-200 bg-red-50/60 p-4">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={!!draft.critical_safety_failure} onChange={(event) => update({ critical_safety_failure: event.target.checked })} className="mt-0.5 h-4 w-4 rounded border-red-300 text-red-600" />
                <span>
                  <span className="block text-sm font-semibold text-red-800">{text("Confirmed critical safety failure", "إخفاق حرج مؤكد في السلامة")}</span>
                  <span className="block text-xs text-red-700">{text("Only for an unsafe action the candidate affirmed. It makes the result Not Ready and blocks the certificate whatever the average. A missing detail is not a critical failure.", "فقط لتصرف غير آمن أكده المرشح. يجعل النتيجة غير جاهز ويمنع الشهادة مهما كان المتوسط. نقص التفاصيل ليس إخفاقًا حرجًا.")}</span>
                </span>
              </label>
              {draft.critical_safety_failure && (
                <label className="block">
                  <span className="text-sm font-medium text-slate-700">{text("Evidence for the critical safety failure", "دليل الإخفاق الحرج في السلامة")} <span className="text-red-600">*</span></span>
                  <textarea value={draft.critical_safety_failure_note ?? ""} maxLength={5000} rows={3} onChange={(event) => update({ critical_safety_failure_note: event.target.value })}
                    className="mt-1.5 w-full rounded-lg border border-red-200 bg-white p-3 text-sm" />
                </label>
              )}
            </div>
          )}
          {selected === "behavior_integrity" && (
            <p className="rounded-lg bg-sky-50 p-3 text-xs text-slate-600">{text("Rated here and shown as a risk level (High / Medium / Low) in documents. It is not part of the average.", "يُقيَّم هنا ويُعرض كمستوى خطر (مرتفع / متوسط / منخفض) في المستندات، ولا يدخل في المتوسط.")}</p>
          )}
        </section>
      </div>

      <section className="rounded-2xl border border-sky-100 bg-white p-4">
        <label className="block">
          <span className="text-sm font-semibold text-slate-900">{text("Overall comments", "تعليقات عامة")} <span className="font-normal text-slate-500">({text("optional", "اختياري")})</span></span>
          <textarea value={draft.comments ?? ""} maxLength={10000} rows={3} onChange={(event) => update({ comments: event.target.value })}
            className="mt-2 w-full rounded-lg border border-slate-300 p-3 text-sm" />
        </label>
      </section>

      {error && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div className="flex flex-wrap items-center gap-3">
        {canSubmit ? (
          <p className="flex flex-1 items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">{text("All competencies are rated with evidence notes. Ready for final submission.", "تم تقييم جميع الكفاءات مع وصف الأدلة. جاهز للإرسال النهائي.")}</p>
        ) : (
          <p className="flex flex-1 items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" />
            <span>
              {text("Complete the required criteria before final submission.", "أكمل المعايير المطلوبة قبل الإرسال النهائي.")}
              {missing.length > 0 && <span className="block text-xs">{text("Still needed:", "لا يزال مطلوبًا:")} {missing.map((item) => competencyText.label(item)).join(", ")}</span>}
              {safetyNoteMissing && <span className="block text-xs">{text("Describe the evidence for the critical safety failure.", "صف دليل الإخفاق الحرج في السلامة.")}</span>}
            </span>
          </p>
        )}
        <button type="button" onClick={() => void saveDraft()} disabled={busy !== null}
          className="flex h-12 items-center gap-2 rounded-xl border border-blue-900 bg-white px-6 text-sm font-semibold text-blue-950 hover:bg-slate-50 disabled:opacity-50">
          {busy === "save" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{text("Save draft", "حفظ المسودة")}{dirty && " •"}
        </button>
        <div className="text-center">
          <button type="button" onClick={() => void submit()} disabled={!canSubmit || busy !== null}
            className="flex h-12 items-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-violet-600 px-6 text-sm font-semibold text-white disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-500">
            {busy === "submit" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{text("Submit final evaluation", "إرسال التقييم النهائي")}
          </button>
          {!canSubmit && <p className="mt-1 text-[11px] text-slate-500">{text("Required criteria remain unassessed.", "لا تزال معايير مطلوبة دون تقييم.")}</p>}
        </div>
      </div>
      <p className="text-xs text-slate-500">{text("The final submission is locked. Authorized corrections create audited versions. AI assists with evidence and never overwrites evaluator ratings.", "يُقفل الإرسال النهائي. تُنشئ التصحيحات المصرح بها إصدارات مدققة. يساعد الذكاء الاصطناعي في الأدلة ولا يغيّر تقييمات المقيّم.")}</p>
    </div>
  );
}

function EvidenceItem({ segment, number, question, checked, onToggle, languageName }: {
  segment: LiveCallSavedSegment; number: number; question?: LiveCallSavedSegment; checked: boolean; onToggle: () => void; languageName: (code?: string | null) => string;
}) {
  const text = useAssessmentText();
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-lg border p-3 ${checked ? "border-blue-300 bg-blue-50/40" : "border-slate-200"}`}>
      <div className="flex items-start gap-2">
        <input type="checkbox" checked={checked} onChange={onToggle} aria-label={text(`Link conversation entry ${number}`, `ربط مدخل المحادثة ${number}`)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600" />
        <div className="min-w-0 flex-1">
          <button type="button" onClick={() => setOpen((value) => !value)} className="flex items-center gap-1.5 text-xs font-medium text-blue-700">
            <FileText className="h-3.5 w-3.5" />{text("Conversation entry", "مدخل المحادثة")} {String(number).padStart(2, "0")} • {open ? text("Hide original and translation", "إخفاء الأصل والترجمة") : text("View original and translation", "عرض الأصل والترجمة")}
          </button>
          <p className={`mt-1 text-sm text-slate-800 ${open ? "" : "line-clamp-2"}`}>{segment.translated_text || segment.original_text}</p>
          {open && (
            <div className="mt-2 space-y-2 text-xs">
              {question && <p className="text-slate-500">{text("Asked", "السؤال")}: {question.original_text}</p>}
              <p><span className="text-slate-500">{text("Original", "الأصل")} ({languageName(segment.source_language)}):</span> <span className="whitespace-pre-wrap">{segment.original_text}</span></p>
              <p><span className="text-slate-500">{text("Translation", "الترجمة")} ({languageName(segment.target_language)}):</span> <span className="whitespace-pre-wrap">{segment.translated_text}</span></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
