"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Loader2, Mic, Type, XCircle, Clock } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import {
  isSessionCompleted,
  type InterviewSessionPublic,
  type SessionQuestion,
} from "@/app/api/interview-session/types";
import { QuestionCard } from "./components/question-card";
import { AnswerTextForm } from "./components/answer-text-form";
import { AnswerRecorder } from "./components/answer-recorder";

type PageState = "loading" | "not-ready" | "unavailable" | "question" | "submitting" | "completed" | "error";
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

        if (data.status === "COMPLETED") {
          setPageState("completed");
        } else if (["EXPIRED", "CANCELLED", "FAILED"].includes(data.status)) {
          setPageState("unavailable");
        } else if (data.status === "CREATED") {
          setPageState("not-ready");
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

  const handlePlayAudio = async () => {
    setLoadingAudio(true);
    try {
      const artifact = await interviewSessionService.getQuestionAudio(sessionId, token);
      setAudioUrl(artifact.audio_url);
    } catch {
      // audio is optional — silently ignore, candidate can still read the question
    } finally {
      setLoadingAudio(false);
    }
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

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {session && (
          <h1 className="text-xl font-bold text-gray-900">{session.role_name} Interview</h1>
        )}

        {question && (
          <QuestionCard
            question={question}
            questionNumber={questionNumber}
            totalQuestions={totalQuestions}
            onPlayAudio={handlePlayAudio}
            audioUrl={audioUrl}
            loadingAudio={loadingAudio}
          />
        )}

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex gap-2 mb-4">
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
