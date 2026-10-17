"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Info, Loader2, Mic, PauseCircle, Type, XCircle, Clock, ShieldAlert, UserRound } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import {
  isSessionCompleted,
  type InterviewSessionPublic,
  type SessionQuestion,
  type SessionStatus,
} from "@/app/api/interview-session/types";
import { QuestionCard, prefetchQuestionTexts } from "./components/question-card";
import { AnswerTextForm } from "./components/answer-text-form";
import { AnswerRecorder } from "./components/answer-recorder";
import { PrecheckFlow } from "./components/precheck-flow";
import { OrientationTour } from "./components/orientation-tour";
import { LiveCallRoom } from "@/components/live-call/LiveCallRoom";
import { IntegrityMonitor } from "./components/integrity-monitor";
import { TestTimer } from "./components/test-timer";
import { LanguagePanel } from "./components/language-panel";
import { candidateDir, getCandidateStrings, resolveCandidateLanguage } from "./candidate-lang";
import { loadCandidateLanguage } from "./candidate-messages";
import { getLanguageStrings, languageByKey, languageName } from "./language-strings";
import { useInterviewAudio } from "./use-interview-audio";

// English and Arabic are the approved source languages: an Arabic session
// asks the approved Arabic questions, every other session the English ones.
function sourceLanguageOf(session: InterviewSessionPublic | null): "EN" | "AR" {
  return (session?.candidate_language ?? "").toUpperCase() === "AR" ? "AR" : "EN";
}

type PageState =
  | "loading"
  | "not-ready"
  | "scheduled"
  | "live-call"
  | "unavailable"
  | "precheck"
  | "orientation"
  | "question"
  | "submitting"
  | "paused"
  | "terminated"
  | "completed"
  | "error";

// Matches the backend's LIVE_CALL_EARLY_JOIN_MINUTES default (see
// api/live_calls/views.py) - a scheduled session's link switches from the
// "scheduled" waiting screen into the actual live-call room this far ahead
// of its scheduled_start_at, so the candidate can join and wait for the
// evaluator instead of watching a second countdown first. If that backend
// setting is ever overridden away from its default, this constant needs to
// move in step with it.
const LIVE_CALL_EARLY_JOIN_MINUTES = 15;
type AnswerMode = "audio" | "text";

export default function InterviewSessionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
        </div>
      }
    >
      <InterviewSessionContent />
    </Suspense>
  );
}

function InterviewSessionContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") ?? "";
  const token = searchParams.get("token") ?? "";

  const [pageState, setPageState] = useState<PageState>("loading");
  const [session, setSession] = useState<InterviewSessionPublic | null>(null);
  const [question, setQuestion] = useState<SessionQuestion | null>(null);
  const [answerMode, setAnswerMode] = useState<AnswerMode>("audio");
  const [error, setError] = useState<string | null>(null);
  // Which approved version is on screen (EN/AR) and the candidate's answer
  // language (any supported language; translations are shown for it).
  const [displayKey, setDisplayKey] = useState<string>("EN");
  const [answerKey, setAnswerKey] = useState<string>("EN");
  const audio = useInterviewAudio(sessionId, token);
  const stopAudio = audio.stop;
  const [translationStatus, setTranslationStatus] = useState<"not-needed" | "checking" | "available" | "unavailable">("not-needed");
  // The page's own language: the candidate's language chosen for this
  // assessment when there's a translation for it, otherwise the session's
  // English/Arabic. Set once the session (and that translation) has loaded.
  const [uiKey, setUiKey] = useState<string>("");

  // Translate the remaining questions in the background once the current
  // one is on screen, so each next question's translation is instant.
  const questionIds = (session?.questions ?? []).map((q) => q.id).join(",");
  useEffect(() => {
    if (pageState !== "question" || !questionIds || answerKey === displayKey) return;
    return prefetchQuestionTexts(sessionId, token, questionIds.split(","), answerKey);
  }, [pageState, questionIds, answerKey, displayKey, sessionId, token]);

  // Drives the whole candidate-facing experience's language/RTL layout -
  // see ./candidate-lang.ts. Independent of this route's [locale] URL
  // segment, which only governs next-intl's marketing/admin/dashboard UI.
  const t = getCandidateStrings(uiKey).interviewPage;
  const dir = candidateDir(resolveCandidateLanguage(uiKey));

  const loadCurrentQuestion = useCallback(async () => {
    stopAudio();
    try {
      const result = await interviewSessionService.getCurrentQuestion(sessionId, token);
      if (isSessionCompleted(result)) {
        try {
          await interviewSessionService.completeSession(sessionId, token);
        } catch {
          // The session may already be COMPLETED (e.g. a duplicate/racing
          // call) — re-check the real status before treating this as a
          // failure, since "already completed" isn't actually an error.
          const current = await interviewSessionService.getSession(sessionId, token);
          if (current.status !== "COMPLETED") throw current;
        }
        setPageState("completed");
        return;
      }
      setQuestion(result);
      setPageState("question");
    } catch {
      setError(t.loadQuestionError);
      setPageState("error");
    }
  }, [sessionId, token, stopAudio]);

  // Shared by the initial mount check and the "scheduled" screen's re-check
  // poll below - resolves what to show for a freshly-fetched session. A
  // CREATED session with a future scheduled_start_at gets the "scheduled"
  // waiting screen; once due (or if it was never scheduled at all - the
  // pre-scheduling behavior, where staff always create+start together),
  // the candidate self-serves the start themselves, since nothing else in
  // the product starts a scheduled session automatically at its due time.
  const resolveSessionState = useCallback(
    async (data: InterviewSessionPublic, active: () => boolean) => {
      const interfaceKey = await loadCandidateLanguage(data.preferred_language, resolveCandidateLanguage(data.ui_language));
      if (!active()) return;
      setUiKey(interfaceKey);
      const source = sourceLanguageOf(data);
      setDisplayKey(source);
      // Default answer language: the candidate's own language when it's a
      // supported one, otherwise the session's language.
      const preferred = languageByKey(data.preferred_language) ?? languageByKey(data.candidate_language);
      const initialAnswerKey = preferred?.key ?? source;
      setAnswerKey(initialAnswerKey);
      // Some languages have no working speech-to-text provider (see
      // LANGUAGES' `stt` flag) - recorded answers would transcribe badly,
      // so those languages answer by text instead of producing a
      // misleading transcript. Re-applied when the answer language changes.
      if (!languageByKey(initialAnswerKey)?.stt) setAnswerMode("text");

      if (data.status === "COMPLETED") {
        setPageState("completed");
      } else if (["EXPIRED", "CANCELLED", "FAILED"].includes(data.status)) {
        setPageState("unavailable");
      } else if (data.status === "CREATED" && data.scheduled_start_at) {
        // Scheduled interviews enter the live room only after the same
        // consent and verification checks used by the async assessment.
        const scheduledMs = new Date(data.scheduled_start_at).getTime();
        const earlyJoinMs = LIVE_CALL_EARLY_JOIN_MINUTES * 60_000;
        if (Date.now() < scheduledMs - earlyJoinMs) {
          setPageState("scheduled");
          return;
        }
        const prechecks = await interviewSessionService.getPrecheckStatus(sessionId, token);
        setPageState(prechecks.candidate_prechecks_complete ? "live-call" : "precheck");
      } else if (data.status === "CREATED") {
        // Never scheduled. The backend requires consent, identity verification,
        // device check, and privacy acknowledgement to all be complete
        // before it will let a candidate-initiated start through - none of
        // those require the session to already be IN_PROGRESS, so send an
        // unverified candidate to prechecks first rather than trying (and
        // failing) to start immediately. Starting happens once prechecks
        // finish - see handlePrecheckContinue.
        const prechecks = await interviewSessionService.getPrecheckStatus(sessionId, token);
        if (!prechecks.candidate_prechecks_complete) {
          setPageState("precheck");
          return;
        }
        try {
          const started = await interviewSessionService.startSession(sessionId, token);
          if (!active()) return;
          setSession(started);
          await loadCurrentQuestion();
        } catch {
          if (active()) setPageState("not-ready");
        }
      } else if (data.status === "PAUSED") {
        // Reload mid-pause (e.g. candidate refreshed the page) - current-question
        // would reject this anyway since the session isn't IN_PROGRESS, so show
        // the same blocking screen the live callback below would show.
        setPageState("paused");
      } else {
        const prechecks = await interviewSessionService.getPrecheckStatus(sessionId, token);
        if (!prechecks.candidate_prechecks_complete) {
          setPageState("precheck");
          return;
        }
        await loadCurrentQuestion();
      }
    },
    [sessionId, token, loadCurrentQuestion]
  );

  useEffect(() => {
    if (!sessionId || !token) {
      setError(t.missingLinkError);
      setPageState("unavailable");
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await interviewSessionService.getSession(sessionId, token);
        if (!active) return;
        setSession(data);
        await resolveSessionState(data, () => active);
      } catch {
        if (active) {
          setError(t.notFoundError);
          setPageState("unavailable");
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

  // While waiting for a scheduled interview's start time, periodically
  // re-check rather than making the candidate manually refresh the page.
  useEffect(() => {
    if (pageState !== "scheduled") return;
    let active = true;
    const interval = setInterval(async () => {
      try {
        const data = await interviewSessionService.getSession(sessionId, token);
        if (!active) return;
        setSession(data);
        await resolveSessionState(data, () => active);
      } catch {
        // Transient error - the next tick will retry; no need to surface
        // this while the candidate is just waiting.
      }
    }, 30_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [pageState, sessionId, token, resolveSessionState]);

  // Once prechecks finish, the candidate starts an unscheduled assessment.
  // Scheduled assessments enter the live room and start at the scheduled time.
  const handlePrecheckContinue = useCallback(async () => {
    try {
      const latest = await interviewSessionService.getSession(sessionId, token);
      setSession(latest);

      if (latest.scheduled_start_at) {
        const scheduledMs = new Date(latest.scheduled_start_at).getTime();
        if (Date.now() >= scheduledMs && latest.status !== "IN_PROGRESS") {
          const started = await interviewSessionService.startSession(sessionId, token);
          setSession(started);
        }
        setPageState("live-call");
        return;
      }

      if (latest.status !== "IN_PROGRESS") {
        const started = await interviewSessionService.startSession(sessionId, token);
        setSession(started);
      }
    } catch {
      setError(t.startError);
      setPageState("not-ready");
      return;
    }
    // A brief one-time orientation before the first question, rather than
    // dropping the candidate straight into it - loadCurrentQuestion (and
    // the question view itself) only runs once they finish or skip it.
    setPageState("orientation");
  }, [sessionId, token]);

  const handleOrientationDone = useCallback(() => {
    loadCurrentQuestion();
  }, [loadCurrentQuestion]);

  const hasAutoCompletedRef = useRef(false);
  const handleTimeUp = useCallback(async () => {
    if (hasAutoCompletedRef.current) return;
    hasAutoCompletedRef.current = true;
    try {
      await interviewSessionService.completeSession(sessionId, token);
    } catch {
      // Time's up either way - show the completed screen even if the
      // session was already closed by some other means in the meantime.
    }
    setPageState("completed");
  }, [sessionId, token]);

  const handleIntegrityStatusChange = (status: SessionStatus) => {
    if (status === "PAUSED") {
      setPageState("paused");
    } else if (status === "FAILED") {
      setPageState("terminated");
    } else if (status === "IN_PROGRESS") {
      // Auto-resumed after a pause - the last-loaded question is still valid
      // (the backend guard never let it change while paused), so just
      // return to the question view rather than re-fetching.
      setPageState((current) => (current === "paused" ? "question" : current));
    }
  };

  const handleAnswerKeyChange = (key: string) => {
    setAnswerKey(key);
    stopAudio();
    // An stt-incapable language answers by text; switching away doesn't
    // force audio back, since the candidate may prefer typing. Answers
    // already typed or recorded are kept (both inputs stay mounted).
    if (!languageByKey(key)?.stt) setAnswerMode("text");
  };

  const answerLanguage = languageByKey(answerKey)?.code ?? "en-US";

  const handleTextSubmit = async (text: string) => {
    if (!question) return;
    setPageState("submitting");
    setError(null);
    try {
      await interviewSessionService.submitTextResponse(sessionId, token, {
        question_id: question.id,
        transcript: text,
        text_response: text,
        language_code: answerLanguage,
      });
      await loadCurrentQuestion();
    } catch {
      setError(t.submitAnswerError);
      setPageState("question");
    }
  };

  const handleAudioSubmit = async (blob: Blob, durationSeconds: number) => {
    if (!question) return;
    setPageState("submitting");
    setError(null);
    try {
      const uploaded = await interviewSessionService.uploadResponseAudio(
        sessionId,
        token,
        question.id,
        blob,
        durationSeconds
      );
      await interviewSessionService.transcribeResponse(sessionId, token, uploaded.id, answerLanguage);
      await loadCurrentQuestion();
    } catch {
      setError(t.submitRecordingError);
      setPageState("question");
    }
  };

  if (pageState === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if (pageState === "not-ready") {
    return (
      <CenteredCard dir={dir}>
        <Clock className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.notReadyTitle}</h1>
        <p className="text-gray-600">{t.notReadyBody}</p>
      </CenteredCard>
    );
  }

  if (pageState === "scheduled") {
    const scheduledAt = session?.scheduled_start_at ? new Date(session.scheduled_start_at) : null;
    // Dates in the candidate's language (the browser falls back to its own
    // locale for any it doesn't know).
    const locale = resolveCandidateLanguage(uiKey) === "en" ? undefined : resolveCandidateLanguage(uiKey);
    const formattedDateTime = scheduledAt
      ? `${scheduledAt.toLocaleDateString(locale, {
          weekday: "long",
          month: "long",
          day: "numeric",
        })} ${scheduledAt.toLocaleTimeString(locale, {
          hour: "numeric",
          minute: "2-digit",
        })}`
      : null;
    return (
      <CenteredCard dir={dir}>
        <Clock className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.scheduledTitle}</h1>
        <p className="text-gray-600">{t.scheduledBody(formattedDateTime)}</p>
      </CenteredCard>
    );
  }

  if (pageState === "live-call") {
    // LiveCallRoom owns its own "call ended" screen internally once the
    // call finishes - no page-level state transition needed on top of it.
    return <LiveCallRoom sessionId={sessionId} candidateToken={token} uiLanguage={uiKey} />;
  }

  if (pageState === "precheck") {
    return (
      <PrecheckFlow
        sessionId={sessionId}
        token={token}
        onContinue={handlePrecheckContinue}
        isLiveCall={Boolean(session?.scheduled_start_at)}
        uiLanguage={uiKey}
        candidateName={session?.candidate_name}
        preferredLanguage={session?.preferred_language}
        statementLanguage={session?.ui_language}
      />
    );
  }

  if (pageState === "orientation") {
    return <OrientationTour onDone={handleOrientationDone} uiLanguage={uiKey} />;
  }

  if (pageState === "paused") {
    return (
      <CenteredCard dir={dir}>
        <PauseCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.pausedTitle}</h1>
        <p className="text-gray-600">{t.pausedBody}</p>
        <div className="mt-4">
          <IntegrityMonitor
            sessionId={sessionId}
            token={token}
            onSessionStatusChange={handleIntegrityStatusChange}
            uiLanguage={uiKey}
          />
        </div>
      </CenteredCard>
    );
  }

  if (pageState === "terminated") {
    return (
      <CenteredCard dir={dir}>
        <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.terminatedTitle}</h1>
        <p className="text-gray-600">{t.terminatedBody}</p>
      </CenteredCard>
    );
  }

  if (pageState === "unavailable") {
    const isExpired = session?.status === "EXPIRED";
    return (
      <CenteredCard dir={dir}>
        <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{isExpired ? t.expiredTitle : t.inactiveTitle}</h1>
        <p className="text-gray-600">
          {session?.status === "CANCELLED" && session.cancellation_reason
            ? t.cancelledMessage(session.cancellation_reason)
            : isExpired
              ? t.expiredMessage
              : (error ?? t.genericUnavailableMessage)}
        </p>
      </CenteredCard>
    );
  }

  if (pageState === "completed") {
    return (
      <CenteredCard dir={dir}>
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.completedTitle}</h1>
        <p className="text-gray-600">{t.completedMessage(session?.role_name ?? null)}</p>
      </CenteredCard>
    );
  }

  if (pageState === "error") {
    return (
      <CenteredCard dir={dir}>
        <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">{t.errorTitle}</h1>
        <p className="text-gray-600">{error}</p>
      </CenteredCard>
    );
  }

  // pageState === "question" | "submitting"
  const submitting = pageState === "submitting";
  const totalQuestions = session?.total_questions ?? 0;
  const questionNumber = question ? question.question_order : 0;
  const ui = resolveCandidateLanguage(uiKey);
  const tl = getLanguageStrings(ui);
  const answerName = languageName(answerKey, ui);
  const audioAnswersUnavailable = !languageByKey(answerKey)?.stt;

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-6 sm:py-8" dir={dir}>
      <div className="mx-auto max-w-6xl space-y-5">
        {session && (
          <header className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                <UserRound className="h-6 w-6" />
              </span>
              <div>
                <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">{t.interviewTitle(session.role_name)}</h1>
              </div>
            </div>
            {session.started_at && session.config_details?.duration_minutes ? (
              <TestTimer
                startedAt={session.started_at}
                durationMinutes={session.config_details.duration_minutes}
                onTimeUp={handleTimeUp}
                uiLanguage={uiKey}
              />
            ) : null}
          </header>
        )}

        <IntegrityMonitor
          sessionId={sessionId}
          token={token}
          onSessionStatusChange={handleIntegrityStatusChange}
          uiLanguage={uiKey}
        />

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="min-w-0 space-y-5">
            {question && (
              <QuestionCard
                key={question.id}
                sessionId={sessionId}
                token={token}
                question={question}
                questionNumber={questionNumber}
                totalQuestions={totalQuestions}
                sourceKey={sourceLanguageOf(session)}
                displayKey={displayKey}
                onDisplayKeyChange={(key) => {
                  stopAudio();
                  setDisplayKey(key);
                }}
                answerKey={answerKey}
                audio={audio}
                onTranslationStatus={setTranslationStatus}
                uiLanguage={uiKey}
              />
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-semibold text-gray-900">{tl.yourAnswerTitle(answerName)}</h2>
                  <p className="text-sm text-gray-500">{tl.yourAnswerHint(answerName)}</p>
                </div>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs ${
                    audioAnswersUnavailable ? "bg-amber-50 text-amber-800" : "bg-emerald-50 text-emerald-700"
                  }`}
                >
                  <Mic className="h-3.5 w-3.5" />
                  {audioAnswersUnavailable ? tl.voiceUnsupported(answerName) : tl.voiceSupported(answerName)}
                </span>
              </div>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAnswerMode("audio")}
                  disabled={audioAnswersUnavailable}
                  aria-pressed={answerMode === "audio"}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
                    answerMode === "audio" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  <Mic className="h-4 w-4" /> {t.recordAnswerButton}
                </button>
                <button
                  type="button"
                  onClick={() => setAnswerMode("text")}
                  aria-pressed={answerMode === "text"}
                  className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 text-sm font-medium ${
                    answerMode === "text" ? "border-purple-500 bg-purple-50 text-purple-700" : "border-gray-200 text-gray-600"
                  }`}
                >
                  <Type className="h-4 w-4" /> {t.typeAnswerButton}
                </button>
              </div>

              {error && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
              )}

              {/* Both inputs stay mounted (one hidden) so switching answer
                  type or language never erases a typed or recorded answer.
                  Each question remounts them (key), starting fresh. */}
              <div hidden={answerMode !== "audio" || audioAnswersUnavailable}>
                <AnswerRecorder
                  key={`rec-${question?.id}`}
                  onSubmit={handleAudioSubmit}
                  onRecordingStart={stopAudio}
                  submitting={submitting}
                  submitLabel={t.uploadingLabel}
                  recordingLanguageLabel={tl.recordingIn(answerName)}
                  uiLanguage={uiKey}
                />
              </div>
              <div hidden={answerMode !== "text" && !audioAnswersUnavailable}>
                <AnswerTextForm
                  key={`text-${question?.id}`}
                  onSubmit={handleTextSubmit}
                  submitting={submitting}
                  uiLanguage={uiKey}
                  textLanguage={answerKey}
                />
              </div>
              <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500">
                <Info className="h-3.5 w-3.5 shrink-0" /> {tl.answerKept}
              </p>
            </section>
          </div>

          <LanguagePanel
            answerKey={answerKey}
            onAnswerKeyChange={handleAnswerKeyChange}
            translationStatus={translationStatus}
            uiLanguage={uiKey}
          />
        </div>
      </div>
    </div>
  );
}

function CenteredCard({ children, dir }: { children: React.ReactNode; dir?: "ltr" | "rtl" }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" dir={dir}>
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">{children}</div>
    </div>
  );
}
