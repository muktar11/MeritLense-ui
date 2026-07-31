"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mic, PauseCircle, Type, XCircle, Clock, ShieldAlert } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import {
  isSessionCompleted,
  type InterviewSessionPublic,
  type SessionQuestion,
  type SessionStatus,
} from "@/app/api/interview-session/types";
import { QuestionCard } from "./components/question-card";
import { AnswerTextForm } from "./components/answer-text-form";
import { AnswerRecorder } from "./components/answer-recorder";
import { IdentityVerification } from "./components/identity-verification";
import { IntegrityMonitor } from "./components/integrity-monitor";
import { TestTimer } from "./components/test-timer";

type PageState =
  | "loading"
  | "not-ready"
  | "unavailable"
  | "precheck"
  | "question"
  | "submitting"
  | "paused"
  | "terminated"
  | "completed"
  | "error";
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [readAloudLanguage, setReadAloudLanguage] = useState("en-US");

  const loadCurrentQuestion = useCallback(async () => {
    setAudioUrl(null);
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
      setError("Something went wrong loading your next question. Please refresh the page.");
      setPageState("error");
    }
  }, [sessionId, token]);

  useEffect(() => {
    if (!sessionId || !token) {
      setError("This interview link is missing required information.");
      setPageState("unavailable");
      return;
    }
    let active = true;
    (async () => {
      try {
        const data = await interviewSessionService.getSession(sessionId, token);
        if (!active) return;
        setSession(data);
        if (data.tts_language_code) setReadAloudLanguage(data.tts_language_code);
        // Afaan Oromo has no working speech-to-text provider (confirmed
        // directly - Whisper doesn't list it as supported), so recorded
        // audio answers would transcribe unreliably at best. Force text
        // answers instead of silently producing bad transcriptions.
        if (data.candidate_language === "OM") setAnswerMode("text");

        if (data.status === "COMPLETED") {
          setPageState("completed");
        } else if (["EXPIRED", "CANCELLED", "FAILED"].includes(data.status)) {
          setPageState("unavailable");
        } else if (data.status === "CREATED") {
          setPageState("not-ready");
        } else if (data.status === "PAUSED") {
          // Reload mid-pause (e.g. candidate refreshed the page) - current-question
          // would reject this anyway since the session isn't IN_PROGRESS, so show
          // the same blocking screen the live callback below would show.
          setPageState("paused");
        } else if (!data.identity_verified) {
          setPageState("precheck");
        } else {
          await loadCurrentQuestion();
        }
      } catch {
        if (active) {
          setError("We couldn't find this interview session. The link may be invalid.");
          setPageState("unavailable");
        }
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, token]);

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

  const handlePlayAudio = async () => {
    setLoadingAudio(true);
    try {
      const artifact = await interviewSessionService.getQuestionAudio(sessionId, token, readAloudLanguage);
      setAudioUrl(artifact.audio_url);
    } catch {
      // audio is optional — silently ignore, candidate can still read the question
    } finally {
      setLoadingAudio(false);
    }
  };

  const handleReadAloudLanguageChange = (languageCode: string) => {
    setReadAloudLanguage(languageCode);
    // Clear any already-playing audio from the previous language selection -
    // it doesn't match the new choice, and would otherwise keep showing/
    // playing until the candidate clicks play again.
    setAudioUrl(null);
  };

  const handleTextSubmit = async (text: string) => {
    if (!question) return;
    setPageState("submitting");
    setError(null);
    try {
      await interviewSessionService.submitTextResponse(sessionId, token, {
        question_id: question.id,
        transcript: text,
        text_response: text,
      });
      await loadCurrentQuestion();
    } catch {
      setError("Failed to submit your answer. Please try again.");
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
      await interviewSessionService.transcribeResponse(sessionId, token, uploaded.id);
      await loadCurrentQuestion();
    } catch {
      setError("Failed to submit your recording. Please try again.");
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
      <CenteredCard>
        <Clock className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Your interview isn't ready yet</h1>
        <p className="text-gray-600">
          Please contact the person who invited you to this interview — they'll need to start your session
          before you can begin.
        </p>
      </CenteredCard>
    );
  }

  if (pageState === "precheck") {
    return (
      <IdentityVerification sessionId={sessionId} token={token} onContinue={loadCurrentQuestion} />
    );
  }

  if (pageState === "paused") {
    return (
      <CenteredCard>
        <PauseCircle className="w-14 h-14 text-amber-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Interview paused</h1>
        <p className="text-gray-600">
          We noticed more than one person in view. Please make sure you&apos;re alone in front of the camera —
          your interview will resume automatically.
        </p>
        <div className="mt-4">
          <IntegrityMonitor sessionId={sessionId} token={token} onSessionStatusChange={handleIntegrityStatusChange} />
        </div>
      </CenteredCard>
    );
  }

  if (pageState === "terminated") {
    return (
      <CenteredCard>
        <ShieldAlert className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Interview ended</h1>
        <p className="text-gray-600">
          This interview was ended due to repeated integrity violations. Please contact the person who invited
          you if you believe this is a mistake.
        </p>
      </CenteredCard>
    );
  }

  if (pageState === "unavailable") {
    return (
      <CenteredCard>
        <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">This interview link is no longer active</h1>
        <p className="text-gray-600">{error ?? "This session has expired or is no longer available."}</p>
      </CenteredCard>
    );
  }

  if (pageState === "completed") {
    return (
      <CenteredCard>
        <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Interview complete</h1>
        <p className="text-gray-600">
          Thank you{session?.role_name ? ` for completing your ${session.role_name} interview` : ""}. Your
          responses have been submitted.
        </p>
      </CenteredCard>
    );
  }

  if (pageState === "error") {
    return (
      <CenteredCard>
        <XCircle className="w-14 h-14 text-red-500 mx-auto mb-4" />
        <h1 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h1>
        <p className="text-gray-600">{error}</p>
      </CenteredCard>
    );
  }

  // pageState === "question" | "submitting"
  const submitting = pageState === "submitting";
  const totalQuestions = session?.total_questions ?? 0;
  const questionNumber = question ? question.question_order : 0;
  // No working speech-to-text provider for Afaan Oromo - see the mount
  // effect above, which also force-switches answerMode to "text".
  const audioAnswersUnavailable = session?.candidate_language === "OM";

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {session && (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{session.role_name} Interview</h1>
            {session.started_at && session.config_details?.duration_minutes ? (
              <TestTimer
                startedAt={session.started_at}
                durationMinutes={session.config_details.duration_minutes}
                onTimeUp={handleTimeUp}
              />
            ) : null}
          </div>
        )}

        <IntegrityMonitor sessionId={sessionId} token={token} onSessionStatusChange={handleIntegrityStatusChange} />

        {question && (
          <QuestionCard
            question={question}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onPlayAudio={handlePlayAudio}
            audioUrl={audioUrl}
            loadingAudio={loadingAudio}
            readAloudLanguage={readAloudLanguage}
            onReadAloudLanguageChange={handleReadAloudLanguageChange}
          />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-2 mb-4">
            {!audioAnswersUnavailable && (
              <button
                type="button"
                onClick={() => setAnswerMode("audio")}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border ${
                  answerMode === "audio"
                    ? "border-purple-500 bg-purple-50 text-purple-700"
                    : "border-gray-200 text-gray-500"
                }`}
              >
                <Mic className="w-4 h-4" /> Record Answer
              </button>
            )}
            <button
              type="button"
              onClick={() => setAnswerMode("text")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium border ${
                answerMode === "text"
                  ? "border-purple-500 bg-purple-50 text-purple-700"
                  : "border-gray-200 text-gray-500"
              }`}
            >
              <Type className="w-4 h-4" /> Type Answer
            </button>
          </div>
          {audioAnswersUnavailable && (
            <p className="text-xs text-gray-500 -mt-2 mb-4">
              Audio answers aren&apos;t available in Afaan Oromo yet — please type your answer.
            </p>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-3 py-2 rounded-lg text-sm mb-4">
              {error}
            </div>
          )}

          {answerMode === "audio" ? (
            <AnswerRecorder
              onSubmit={handleAudioSubmit}
              submitting={submitting}
              submitLabel="Uploading & transcribing…"
            />
          ) : (
            <AnswerTextForm onSubmit={handleTextSubmit} submitting={submitting} />
          )}
        </div>
      </div>
    </div>
  );
}

function CenteredCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md text-center">{children}</div>
    </div>
  );
}
