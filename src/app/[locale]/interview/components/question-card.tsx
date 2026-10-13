"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight, Loader2, Square, Volume2 } from "lucide-react";
import interviewSessionService from "@/app/api/interview-session/endpoints";
import type { LocalizedText, SessionQuestion } from "@/app/api/interview-session/types";
import { getCandidateStrings, resolveCandidateLanguage } from "../candidate-lang";
import { getLanguageStrings, languageByKey, languageName } from "../language-strings";
import type { useInterviewAudio } from "../use-interview-audio";

const SOURCE_LANGUAGES = ["EN", "AR"] as const;

type Loaded = { state: "loading" } | { state: "ready"; value: LocalizedText } | { state: "unavailable" };

// Per page view: a question's text per language, so switching back and
// forth doesn't refetch (the backend stores translations as well).
const textCache = new Map<string, LocalizedText>();

function useQuestionText(
  sessionId: string,
  token: string,
  question: SessionQuestion,
  sourceKey: string,
  language: string | null
): Loaded | null {
  const cacheKey = language ? `${question.id}:${language}` : "";
  const [result, setResult] = useState<{ key: string; loaded: Loaded } | null>(null);

  useEffect(() => {
    if (!language || language === sourceKey) return;
    const cached = textCache.get(cacheKey);
    if (cached) return;
    let active = true;
    interviewSessionService
      .getQuestionText(sessionId, token, question.id, language)
      .then((value) => {
        textCache.set(cacheKey, value);
        if (active) setResult({ key: cacheKey, loaded: { state: "ready", value } });
      })
      .catch(() => {
        if (active) setResult({ key: cacheKey, loaded: { state: "unavailable" } });
      });
    return () => {
      active = false;
    };
  }, [sessionId, token, question.id, sourceKey, language, cacheKey]);

  if (!language) return null;
  if (language === sourceKey) {
    return { state: "ready", value: { language, text: question.question_text, kind: "original", provider: "" } };
  }
  const cached = textCache.get(cacheKey);
  if (cached) return { state: "ready", value: cached };
  if (result?.key === cacheKey) return result.loaded;
  return { state: "loading" };
}

interface QuestionCardProps {
  sessionId: string;
  token: string;
  question: SessionQuestion;
  questionNumber: number;
  totalQuestions: number;
  /** The approved language this session's questions are asked in (EN/AR). */
  sourceKey: string;
  /** Which approved version is on screen (EN/AR) - the candidate can switch. */
  displayKey: string;
  onDisplayKeyChange: (key: string) => void;
  /** The candidate's answer language (any supported language key). */
  answerKey: string;
  audio: ReturnType<typeof useInterviewAudio>;
  uiLanguage?: string | null;
}

export function QuestionCard({
  sessionId,
  token,
  question,
  questionNumber,
  totalQuestions,
  sourceKey,
  displayKey,
  onDisplayKeyChange,
  answerKey,
  audio,
  uiLanguage,
}: QuestionCardProps) {
  const ui = resolveCandidateLanguage(uiLanguage);
  const t = getCandidateStrings(uiLanguage).questionCard;
  const tl = getLanguageStrings(ui);
  const progressPercent = totalQuestions > 0 ? Math.round((questionNumber / totalQuestions) * 100) : 0;
  const skillTag = question.skill_tag || question.skill;

  const shown = useQuestionText(sessionId, token, question, sourceKey, displayKey);
  // The translation block appears whenever the answer language differs from
  // the approved version on screen.
  const translationKey = answerKey !== displayKey ? answerKey : null;
  const translation = useQuestionText(sessionId, token, question, sourceKey, translationKey);
  const otherSource = SOURCE_LANGUAGES.find((key) => key !== displayKey) ?? "EN";

  const shownText = shown?.state === "ready" ? shown.value.text : question.question_text;
  const shownLabel =
    displayKey === sourceKey ? tl.originalLabel(languageName(displayKey, ui)) : tl.approvedLabel(languageName(displayKey, ui));

  return (
    <div className="space-y-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6">
      <div>
        <div className="mb-1.5 flex items-center justify-between text-sm text-gray-700">
          <span className="font-medium">{t.questionOf(questionNumber, totalQuestions)}</span>
          <span className="text-gray-500" dir="ltr">{progressPercent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div className="h-full bg-purple-600 transition-all" style={{ width: `${progressPercent}%` }} />
        </div>
      </div>

      {/* Original / approved question */}
      <section className="rounded-xl bg-indigo-50/60 p-4 sm:p-5" aria-label={shownLabel}>
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <span className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-800">{shownLabel}</span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onDisplayKeyChange(otherSource)}
              className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-white px-3 py-1.5 text-xs font-medium text-indigo-700 hover:bg-indigo-50"
            >
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {tl.showIn(languageName(otherSource, ui))}
            </button>
            <ListenButton
              audioKey={`original:${displayKey}`}
              label={tl.listenIn(languageName(displayKey, ui))}
              stopLabel={tl.stop}
              audio={audio}
              disabled={shown?.state !== "ready"}
              onPlay={() =>
                audio.play(`original:${displayKey}`, {
                  text: shownText,
                  languageCode: languageByKey(displayKey)?.code ?? "en-US",
                  serverLanguageCode: languageByKey(displayKey)?.code,
                })
              }
            />
          </div>
        </div>
        {shown?.state === "loading" ? (
          <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> {tl.translating}</p>
        ) : (
          <h2
            className="text-lg font-semibold leading-relaxed text-gray-900 sm:text-xl"
            dir={displayKey === "AR" ? "rtl" : "ltr"}
            lang={displayKey.toLowerCase()}
          >
            {shown?.state === "unavailable" ? question.question_text : shownText}
          </h2>
        )}
        {(question.domain || skillTag) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {question.domain && (
              <span className="rounded-full bg-white px-2.5 py-1 text-xs text-gray-600">{t.domainLabel(question.domain)}</span>
            )}
            {skillTag && (
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs text-blue-700">{t.skillTagLabel(skillTag)}</span>
            )}
          </div>
        )}
        {audio.notice?.key === `original:${displayKey}` && (
          <AudioNotice text={tl.audioUnavailable(languageName(displayKey, ui))} />
        )}
      </section>

      {/* Translation into the answer language */}
      {translationKey && (
        <section className="rounded-xl bg-purple-50/70 p-4 sm:p-5" aria-label={tl.translationLabel(languageName(translationKey, ui))}>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
              {translation?.state === "ready" && translation.value.kind !== "machine"
                ? tl.approvedLabel(languageName(translationKey, ui))
                : tl.translationLabel(languageName(translationKey, ui))}
            </span>
            {translation?.state === "ready" && (
              <ListenButton
                audioKey={`translation:${translationKey}`}
                label={tl.listenIn(languageName(translationKey, ui))}
                stopLabel={tl.stop}
                audio={audio}
                disabled={false}
                onPlay={() =>
                  audio.play(`translation:${translationKey}`, {
                    text: translation.value.text,
                    languageCode: languageByKey(translationKey)?.code ?? translationKey.toLowerCase(),
                    // Server voices exist only for languages marked tts.
                    serverLanguageCode: languageByKey(translationKey)?.tts ? languageByKey(translationKey)?.code : null,
                  })
                }
              />
            )}
          </div>
          {translation?.state === "loading" && (
            <p className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> {tl.translating}</p>
          )}
          {translation?.state === "ready" && (
            <p
              className="text-lg leading-relaxed text-gray-900"
              dir="auto"
              lang={translationKey.toLowerCase()}
            >
              {translation.value.text}
            </p>
          )}
          {translation?.state === "unavailable" && (
            <p className="text-sm text-amber-800" role="status">{tl.translationUnavailable(languageName(translationKey, ui))}</p>
          )}
          {audio.notice?.key === `translation:${translationKey}` && (
            <AudioNotice text={tl.audioUnavailable(languageName(translationKey, ui))} />
          )}
        </section>
      )}
    </div>
  );
}

function ListenButton({
  audioKey,
  label,
  stopLabel,
  audio,
  disabled,
  onPlay,
}: {
  audioKey: string;
  label: string;
  stopLabel: string;
  audio: ReturnType<typeof useInterviewAudio>;
  disabled: boolean;
  onPlay: () => void;
}) {
  const active = audio.state.key === audioKey;
  const loading = active && audio.state.status === "loading";
  const playing = active && audio.state.status === "playing";
  return (
    <button
      type="button"
      onClick={() => (playing || loading ? audio.stop() : onPlay())}
      disabled={disabled}
      aria-pressed={playing}
      className="inline-flex items-center gap-1.5 rounded-full border border-purple-200 bg-white px-3 py-1.5 text-xs font-medium text-purple-700 shadow-sm hover:bg-purple-50 disabled:opacity-40"
    >
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : playing ? <Square className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
      {playing ? stopLabel : label}
    </button>
  );
}

function AudioNotice({ text }: { text: string }) {
  return (
    <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800" role="status">
      {text}
    </p>
  );
}
