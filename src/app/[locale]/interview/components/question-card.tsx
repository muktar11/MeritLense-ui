"use client";

import { Volume2, Loader2 } from "lucide-react";
import type { SessionQuestion } from "@/app/api/interview-session/types";

interface QuestionCardProps {
  question: SessionQuestion;
  questionNumber: number;
  totalQuestions: number;
  onPlayAudio: () => void;
  audioUrl: string | null;
  loadingAudio: boolean;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  onPlayAudio,
  audioUrl,
  loadingAudio,
}: QuestionCardProps) {
  const progressPercent = totalQuestions > 0 ? Math.round((questionNumber / totalQuestions) * 100) : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>
            Question {questionNumber} of {totalQuestions}
          </span>
          <span>{progressPercent}%</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-purple-600 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      <div className="flex items-start justify-between gap-3">
        <h2 className="text-lg font-semibold text-gray-900 leading-relaxed">{question.question_text}</h2>
        <button
          type="button"
          onClick={onPlayAudio}
          disabled={loadingAudio}
          className="shrink-0 p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 disabled:opacity-50"
          title="Listen to question"
        >
          {loadingAudio ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
        </button>
      </div>

      {(question.domain || question.skill) && (
        <div className="flex gap-2 mt-3">
          {question.domain && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{question.domain}</span>
          )}
          {question.skill && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">{question.skill}</span>
          )}
        </div>
      )}

      {audioUrl && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio className="w-full mt-4" src={audioUrl} controls autoPlay />
      )}
    </div>
  );
}
