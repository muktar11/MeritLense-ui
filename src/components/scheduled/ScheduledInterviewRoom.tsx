"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AlertTriangle, ArrowRight, BookOpen, CheckCircle2, ChevronRight, Circle, Info, Keyboard, Loader2, MessageSquare,
  Mic, MoreVertical, Play, RotateCcw, Send, Square, UserCheck, UserX,
} from "lucide-react";
import type { ScorecardCompetency } from "@/app/api/evaluations/types";
import type { LiveCallGuide, LiveCallTranslationSegment } from "@/app/api/live-calls/types";
import { useAssessmentText } from "@/components/evaluations/assessment-ui";
import { SearchSelect } from "@/components/app/searchable-fields";
import { TranslatedAudioQueue } from "@/components/live-call/audio-queue";
import { useLiveCall } from "@/components/live-call/useLiveCall";
import { LANGUAGES } from "@/lib/languages";
import { COMPETENCIES, initials, ScheduledModeBadge, ScheduledStepper, useCompetencyText, useLanguageName } from "./scheduled-ui";

interface Props {
  sessionId: string;
  guide: LiveCallGuide;
  onContinue: () => void;
}

// Stage 1 of the scheduled flow, evaluator side. Reuses the existing live
// call (video, turn-based voice translation, admission) and adds typed
// turns, the competency guide and per-competency evidence coverage. The
// candidate keeps their own room (LiveCallRoom).
export function ScheduledInterviewRoom({ sessionId, guide, onContinue }: Props) {
  const text = useAssessmentText();
  const t = useTranslations("shared.liveCallRoom");
  const tLanguages = useTranslations("dashboard.indivisual.settings.edit-profile-tab.languages");
  const tSearch = useTranslations("shared.searchableSelect");
  const languageName = useLanguageName();
  const competencyText = useCompetencyText();
  const [selected, setSelected] = useState<ScorecardCompetency>("safety_awareness");
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const call = useLiveCall({ sessionId, getCompetency: () => selectedRef.current });
  const {
    status, error, notOpenUntil, remoteConnected, languagePrefs, setLanguagePrefs, translationUnavailable,
    translationSegments, turnRecordingState, turnRecordingError, turnPreviewUrl, turnElapsedSeconds, remoteTurnActive,
    startTurnRecording, stopTurnRecording, reRecordTurn, submitTurnRecording, joinRequest, admitCandidate,
    denyCandidate, endCall, localVideoRef, remoteVideoRef, participants, sendTextTurn, sendingText,
  } = call;
  const [mode, setMode] = useState<"type" | "audio">("type");
  const [draft, setDraft] = useState("");
  const [savingLanguage, setSavingLanguage] = useState(false);
  const feedEndRef = useRef<HTMLDivElement>(null);
  const replayQueue = useRef(new TranslatedAudioQueue());

  const conversation = useMemo(() => [...translationSegments].reverse(), [translationSegments]);
  useEffect(() => { feedEndRef.current?.scrollIntoView({ block: "nearest" }); }, [conversation.length]);
  // The candidate ended the call: move on to the scorecard.
  useEffect(() => { if (status === "ended") onContinue(); }, [status, onContinue]);

  const candidatePrefs = participants.find((p) => p.role === "CANDIDATE");
  const evidenceFor = (key: ScorecardCompetency) =>
    conversation.filter((segment) => segment.speaker_role === "CANDIDATE" && segment.competency === key).length;
  const meta = COMPETENCIES.find((item) => item.key === selected)!;
  const suggestions = guide.competencies.find((item) => item.key === selected)?.questions ?? [];
  const evidenceCount = evidenceFor(selected);
  const languageOptions = LANGUAGES.map((lang) => ({ value: lang.code, label: tLanguages(lang.key), keywords: lang.key }));
  const sessionRef = `SC-${guide.session_id.slice(0, 8).toUpperCase()}`;
  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  async function changeLanguage(field: "input_language" | "output_language", value: string) {
    if (!languagePrefs) return;
    setSavingLanguage(true);
    try { await setLanguagePrefs({ ...languagePrefs, [field]: value }); } finally { setSavingLanguage(false); }
  }
  async function send() {
    if (await sendTextTurn(draft)) setDraft("");
  }
  function continueToScorecard() {
    if (!confirm(text("End the call for both participants and continue to the scorecard?", "إنهاء المكالمة للطرفين والانتقال إلى بطاقة التقييم؟"))) return;
    endCall();
    onContinue();
  }

  if (status === "error") {
    return (
      <div className="mx-auto mt-10 max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <h1 className="mb-2 text-xl font-bold text-slate-900">{t("couldntJoin")}</h1>
        <p className="text-slate-600">{error ?? t("refreshAndTryAgain")}</p>
        {notOpenUntil && (
          <p className="mt-3 text-sm text-slate-500">
            {t("opensAt")}{" "}
            <span className="font-medium text-slate-700">
              {new Date(notOpenUntil).toLocaleString(undefined, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit" })}
            </span>{" "}
            {t("yourLocalTime")}
          </p>
        )}
      </div>
    );
  }

  const statusLabel = {
    idle: t("statusJoining"), joining: t("statusJoining"), waiting: t("statusWaiting"),
    pending_admission: t("statusPendingAdmission"), reconnecting: t("statusReconnecting"),
    connecting: t("statusConnecting"), active: "", ended: "", error: "",
  }[status];

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-blue-950 md:text-3xl">{text("Scheduled Interview", "مقابلة مجدولة")}</h1>
            <ScheduledModeBadge />
          </div>
          <p className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-sm text-slate-600">
            <span>{text("Candidate", "المرشح")}: <b className="text-slate-900">{guide.candidate.name}</b></span>
            <span aria-hidden>|</span>
            <span>{text("Role", "الدور")}: <b className="font-medium text-slate-900">{guide.role_name}</b></span>
            <span aria-hidden>|</span>
            <span>{text("Session", "الجلسة")}: <span className="text-slate-900" title={guide.session_id}>{sessionRef}</span></span>
          </p>
        </div>
        <ScheduledStepper stage="interview" />
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
        <section className="space-y-4 rounded-2xl border border-sky-100 bg-white p-4 md:p-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <VideoTile
              videoRef={localVideoRef} muted name={`${guide.evaluator_name || text("Evaluator", "المقيّم")} (${text("Evaluator", "المقيّم")})`}
              language={languageName(languagePrefs?.input_language)} connected={status !== "idle" && status !== "joining"}
            />
            <VideoTile
              videoRef={remoteVideoRef} muted name={`${guide.candidate.name} (${text("Candidate", "المرشح")})`}
              language={languageName(candidatePrefs?.input_language)} connected={remoteConnected}
              overlay={!remoteConnected ? <><Loader2 className="mx-auto mb-2 h-8 w-8 animate-spin" /><p className="text-sm">{statusLabel}</p></> : undefined}
            />
          </div>

          {joinRequest && (
            <div role="alertdialog" aria-label={t("candidateWantsToJoin")} className="flex flex-wrap items-center gap-3 rounded-xl border border-violet-200 bg-violet-50 p-4">
              <UserCheck className="h-6 w-6 text-violet-600" />
              <div className="flex-1"><p className="font-semibold text-slate-900">{t("candidateWantsToJoin")}</p><p className="text-sm text-slate-600">{t("letThemIn")}</p></div>
              <button type="button" onClick={denyCandidate} className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"><UserX className="h-4 w-4" />{t("deny")}</button>
              <button type="button" onClick={admitCandidate} className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"><UserCheck className="h-4 w-4" />{t("admit")}</button>
            </div>
          )}

          {translationUnavailable && (
            <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" />{t("manualTranslationActive")}</p>
          )}
          <p className="flex items-center gap-2 rounded-lg bg-sky-50 px-3 py-2.5 text-sm text-slate-700">
            <Info className="h-4 w-4 shrink-0 text-blue-600" />
            {text("Speak or type in your language. Listen to or read the translation.", "تحدث أو اكتب بلغتك. استمع إلى الترجمة أو اقرأها.")}
          </p>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-950"><MessageSquare className="h-5 w-5" />{text("Conversation", "المحادثة")}</h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span>{t("iSpeak")}</span>
              <SearchSelect id="scheduled-input-language" aria-label={t("iSpeak")} className="w-40" value={languagePrefs?.input_language ?? "en-US"}
                onChange={(value) => changeLanguage("input_language", value)} disabled={savingLanguage} options={languageOptions}
                searchPlaceholder={tSearch("searchLanguages")} buttonClassName="min-h-8 rounded-lg px-2 py-1 text-xs" />
              <span>{t("iWantToHear")}</span>
              <SearchSelect id="scheduled-output-language" aria-label={t("iWantToHear")} className="w-40" value={languagePrefs?.output_language ?? "en-US"}
                onChange={(value) => changeLanguage("output_language", value)} disabled={savingLanguage} options={languageOptions}
                searchPlaceholder={tSearch("searchLanguages")} buttonClassName="min-h-8 rounded-lg px-2 py-1 text-xs" />
            </div>
          </div>

          <div className="max-h-[420px] min-h-[160px] space-y-4 overflow-y-auto pe-1" aria-live="polite">
            {conversation.length === 0 && <p className="rounded-xl border border-dashed border-slate-200 p-4 text-sm text-slate-500">{text("No conversation yet. Speak or type a turn; the candidate receives it in their language.", "لا توجد محادثة بعد. تحدث أو اكتب مداخلة وسيستلمها المرشح بلغته.")}</p>}
            {conversation.map((segment, index) => (
              <ConversationEntry
                key={segment.id} segment={segment} number={index + 1} guide={guide}
                languageName={languageName} competencyLabel={(key) => { const item = COMPETENCIES.find((c) => c.key === key); return item ? competencyText.label(item) : ""; }}
                onPlay={(audio) => { replayQueue.current.clear(); replayQueue.current.enqueue(audio); }}
              />
            ))}
            <div ref={feedEndRef} />
          </div>

          {remoteTurnActive && (
            <p className="flex items-center gap-2 text-xs text-violet-700"><span className="h-2 w-2 animate-pulse rounded-full bg-violet-500" />{t("isSpeaking", { role: t("candidateLabel") })}</p>
          )}
          {(error || turnRecordingError) && (
            <p role="alert" className="flex items-start gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{turnRecordingError ?? error}</p>
          )}

          <div>
            <div role="tablist" aria-label={text("Reply mode", "طريقة الرد")} className="inline-flex rounded-t-lg border border-b-0 border-slate-200 bg-slate-50 text-sm">
              {([["type", Keyboard, text("Type", "كتابة")], ["audio", Mic, text("Audio", "صوت")]] as const).map(([key, Icon, label]) => (
                <button key={key} type="button" role="tab" aria-selected={mode === key} onClick={() => setMode(key)}
                  className={`flex items-center gap-1.5 px-4 py-2 ${mode === key ? "rounded-t-lg bg-white font-semibold text-blue-700" : "text-slate-500"}`}>
                  <Icon className="h-4 w-4" />{label}
                </button>
              ))}
            </div>
            {mode === "type" ? (
              <div className="flex flex-col gap-3 rounded-b-lg rounded-se-lg border border-slate-200 p-3 sm:flex-row">
                <input
                  value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={2000}
                  onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void send(); } }}
                  placeholder={text("Type in your language…", "اكتب بلغتك…")} aria-label={text("Message", "الرسالة")}
                  className="h-11 flex-1 rounded-lg border border-slate-300 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button type="button" disabled={remoteTurnActive || turnRecordingState !== "idle"}
                  onClick={() => { setMode("audio"); void startTurnRecording(); }}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-sky-50 px-5 text-sm font-medium text-blue-800 hover:bg-sky-100 disabled:opacity-50">
                  <Mic className="h-4 w-4" />{text("Speak", "تحدث")}
                </button>
                <button type="button" onClick={() => void send()} disabled={!draft.trim() || sendingText || remoteTurnActive}
                  className="flex h-11 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-blue-500 to-violet-600 px-6 text-sm font-semibold text-white disabled:opacity-50">
                  {sendingText ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}{t("send")}
                </button>
              </div>
            ) : (
              <div className="space-y-2 rounded-b-lg rounded-se-lg border border-slate-200 p-3">
                {turnRecordingState === "idle" && (
                  <button type="button" disabled={remoteTurnActive} onClick={() => void startTurnRecording()}
                    className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-blue-300 py-3 text-sm font-medium text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400">
                    <Mic className="h-4 w-4" />{remoteTurnActive ? t("waitingToFinish", { role: t("candidateLabel") }) : t("tapToRecord")}
                  </button>
                )}
                {turnRecordingState === "recording" && (
                  <div className="flex items-center justify-between gap-3 rounded-lg border-2 border-blue-500 bg-blue-50 px-4 py-2">
                    <span className="flex items-center gap-2 text-sm font-medium"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />{t("recording", { time: formatTime(turnElapsedSeconds) })}</span>
                    <button type="button" onClick={stopTurnRecording} className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-slate-200"><Square className="h-3.5 w-3.5" />{t("stop")}</button>
                  </div>
                )}
                {(turnRecordingState === "recorded" || turnRecordingState === "sending") && turnPreviewUrl && (
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <audio controls src={turnPreviewUrl} className="h-9 flex-1" />
                    <button type="button" onClick={reRecordTurn} disabled={turnRecordingState === "sending"} className="flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-slate-200 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" />{t("reRecord")}</button>
                    <button type="button" onClick={() => void submitTurnRecording()} disabled={turnRecordingState === "sending"} className="flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white disabled:opacity-50">
                      {turnRecordingState === "sending" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}{turnRecordingState === "sending" ? t("sending") : t("send")}
                    </button>
                  </div>
                )}
              </div>
            )}
            <p className="mt-2 text-xs text-slate-500">
              {text("Your turns are filed under", "تُسجَّل مداخلاتك ضمن")} <b>{competencyText.label(meta)}</b>. {text("Pick another competency in the guide to change it.", "اختر كفاءة أخرى من الدليل لتغييرها.")}
            </p>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-2xl border border-sky-100 bg-white">
            <div className="p-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-blue-950"><BookOpen className="h-5 w-5" />{text("Interview guide", "دليل المقابلة")}</h2>
              <p className="mt-1 text-xs text-slate-500">{text("Select a competency to see suggested questions.", "اختر كفاءة لعرض الأسئلة المقترحة.")}</p>
            </div>
            <ul className="border-t border-sky-100">
              {COMPETENCIES.map((item) => {
                const Icon = item.icon;
                const active = item.key === selected;
                return (
                  <li key={item.key}>
                    <button type="button" onClick={() => setSelected(item.key)} aria-pressed={active}
                      className={`flex w-full items-center gap-3 border-b border-sky-50 px-4 py-3 text-start text-sm ${active ? "bg-blue-50 font-semibold text-blue-800 ring-1 ring-inset ring-blue-200" : "text-slate-700 hover:bg-slate-50"}`}>
                      <Icon className="h-5 w-5 shrink-0" />
                      <span className="flex-1">{competencyText.label(item)}</span>
                      {evidenceFor(item.key) > 0 && <CheckCircle2 aria-label={text("Evidence recorded", "تم تسجيل دليل")} className="h-4 w-4 text-emerald-600" />}
                      <ChevronRight className="h-4 w-4 text-slate-400 rtl:rotate-180" />
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-2xl border border-sky-100 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text("Suggested questions", "أسئلة مقترحة")} <span className="font-normal text-slate-500">• {text("Your own questions are allowed.", "يُسمح بأسئلتك الخاصة.")}</span></h3>
            <div className="mt-3 max-h-56 space-y-2 overflow-y-auto">
              {suggestions.length === 0 && <p className="text-sm text-slate-500">{text("No suggested questions for this competency. Ask your own.", "لا توجد أسئلة مقترحة لهذه الكفاءة. اطرح أسئلتك الخاصة.")}</p>}
              {suggestions.map((question) => (
                <button key={question.id} type="button" onClick={() => { setMode("type"); setDraft(question.text); }}
                  title={text("Copy into the message box", "نسخ إلى مربع الرسالة")}
                  className="block w-full rounded-lg border border-slate-200 p-3 text-start text-sm text-slate-800 hover:border-blue-300 hover:bg-blue-50/40">
                  {question.text}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-sky-100 bg-white p-4">
            <h3 className="text-sm font-semibold text-slate-900">{text("Criteria coverage", "تغطية المعايير")} <span className="font-normal text-slate-500">({competencyText.label(meta)})</span></h3>
            <div className="mt-3 flex items-start gap-3">
              {evidenceCount > 0 ? <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600" /> : <Circle className="h-6 w-6 shrink-0 text-slate-300" />}
              <div>
                <p className="text-sm font-medium text-slate-900">{evidenceCount > 0 ? text("Evidence recorded", "تم تسجيل دليل") : text("Not yet assessed", "لم يُقيَّم بعد")}</p>
                <p className="text-xs text-slate-500">
                  {evidenceCount > 0
                    ? text(`${evidenceCount} candidate response(s) captured in this session.`, `تم تسجيل ${evidenceCount} من إجابات المرشح في هذه الجلسة.`)
                    : text("Ask about this competency to capture the candidate's response.", "اسأل عن هذه الكفاءة لتسجيل إجابة المرشح.")}
                </p>
              </div>
            </div>
          </section>

          <button type="button" onClick={continueToScorecard}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-blue-500 to-violet-600 py-3.5 text-sm font-semibold text-white shadow-md shadow-violet-200 hover:opacity-95">
            {text("Continue to scorecard", "المتابعة إلى بطاقة التقييم")}<ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </button>
          <p className="text-center text-xs text-slate-500">{text("This ends the call for both participants.", "سيؤدي هذا إلى إنهاء المكالمة للطرفين.")}</p>
        </aside>
      </div>
    </div>
  );
}

function VideoTile({ videoRef, muted, name, language, connected, overlay }: {
  videoRef: React.RefObject<HTMLVideoElement | null>; muted?: boolean; name: string; language: string; connected: boolean; overlay?: React.ReactNode;
}) {
  const text = useAssessmentText();
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl bg-slate-900">
      <video ref={videoRef} autoPlay playsInline muted={muted} className="h-full w-full object-cover" />
      {overlay && <div className="absolute inset-0 flex items-center justify-center bg-slate-900/70 text-center text-white">{overlay}</div>}
      <span className="absolute end-2 top-2 rounded-md bg-black/40 p-1 text-white" aria-hidden><MoreVertical className="h-4 w-4" /></span>
      <div className="absolute bottom-2 start-2 flex items-center gap-2">
        <span className="rounded-lg bg-black/50 p-2 text-white" aria-hidden><Mic className="h-4 w-4" /></span>
        <div className="rounded-lg bg-black/50 px-3 py-1.5 text-white">
          <p className="flex items-center gap-1.5 text-xs font-semibold"><span className={`h-2 w-2 rounded-full ${connected ? "bg-emerald-400" : "bg-slate-400"}`} />{name}</p>
          <p className="text-[11px] text-slate-200">{text("Language", "اللغة")}: {language}</p>
        </div>
      </div>
    </div>
  );
}

function ConversationEntry({ segment, number, guide, languageName, competencyLabel, onPlay }: {
  segment: LiveCallTranslationSegment; number: number; guide: LiveCallGuide;
  languageName: (code?: string | null) => string; competencyLabel: (key?: string) => string; onPlay: (audio: string) => void;
}) {
  const text = useAssessmentText();
  const candidate = segment.speaker_role === "CANDIDATE";
  const name = candidate ? guide.candidate.name : guide.evaluator_name || text("Evaluator", "المقيّم");
  const tag = competencyLabel(segment.competency);
  return (
    <article className="grid gap-3 sm:grid-cols-[150px_1fr]">
      <div className="flex items-start gap-3">
        {candidate && guide.candidate.photo_url
          ? <img src={guide.candidate.photo_url} alt="" className="h-10 w-10 rounded-full object-cover" />
          : <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-600">{initials(name)}</span>}
        <div className="min-w-0">
          <p className="break-words text-sm font-semibold text-slate-900">{name}</p>
          <p className="text-xs text-slate-500">{candidate ? text("Candidate", "المرشح") : text("Evaluator", "المقيّم")}</p>
          <p className="mt-1 text-[11px] text-slate-400">#{String(number).padStart(2, "0")}{tag && ` · ${tag}`}</p>
        </div>
      </div>
      <div className="space-y-2">
        <div className={`rounded-xl p-3 ${candidate ? "bg-emerald-50/70" : "bg-sky-50"}`}>
          <p className={`text-xs font-medium ${candidate ? "text-emerald-700" : "text-blue-700"}`}>
            {text("Original", "الأصل")} ({languageName(segment.source_language)}){segment.input_mode === "TEXT" && ` · ${text("typed", "مكتوب")}`}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{segment.original_text}</p>
        </div>
        <div className="flex items-start gap-3 rounded-xl bg-violet-50/70 p-3">
          <div className="flex-1">
            <p className="text-xs font-medium text-violet-700">{text(`${languageName(segment.target_language)} translation`, `الترجمة إلى ${languageName(segment.target_language)}`)}</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-slate-900">{segment.translated_text}</p>
          </div>
          {segment.translated_audio && (
            <button type="button" onClick={() => onPlay(segment.translated_audio!)} aria-label={text("Play translation", "تشغيل الترجمة")}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50">
              <Play className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
