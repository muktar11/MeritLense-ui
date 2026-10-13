"use client";

import { CheckCircle2, Globe, Lightbulb, Volume2, XCircle } from "lucide-react";
import { LANGUAGES } from "@/lib/languages";
import { resolveCandidateLanguage } from "../candidate-lang";
import { getLanguageStrings, languageByKey, languageName } from "../language-strings";

interface LanguagePanelProps {
  answerKey: string;
  onAnswerKeyChange: (key: string) => void;
  uiLanguage?: string | null;
}

// Right-hand panel: the candidate's answer language, how the interview
// handles languages, and what's supported for the chosen language.
export function LanguagePanel({ answerKey, onAnswerKeyChange, uiLanguage }: LanguagePanelProps) {
  const ui = resolveCandidateLanguage(uiLanguage);
  const tl = getLanguageStrings(ui);
  const info = languageByKey(answerKey);
  const support = [
    { label: tl.support.translate, ok: true },
    { label: tl.support.listen, ok: Boolean(info?.tts) },
    { label: tl.support.record, ok: Boolean(info?.stt) },
  ];

  return (
    <aside className="space-y-4">
      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-700">
            <Globe className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-semibold text-gray-900">{tl.yourLanguageTitle}</h2>
            <p className="text-xs leading-relaxed text-gray-500">{tl.yourLanguageHint}</p>
          </div>
        </div>
        <label className="sr-only" htmlFor="answer-language">{tl.yourLanguageTitle}</label>
        <select
          id="answer-language"
          value={answerKey}
          onChange={(e) => onAnswerKeyChange(e.target.value)}
          className="h-11 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.key} value={lang.key}>{languageName(lang.key, ui)}</option>
          ))}
        </select>
        <ul className="mt-3 space-y-1.5" aria-label={languageName(answerKey, ui)}>
          {support.map((item) => (
            <li key={item.label} className="flex items-center justify-between text-xs">
              <span className="text-gray-600">{item.label}</span>
              <span className={`inline-flex items-center gap-1 ${item.ok ? "text-emerald-700" : "text-gray-400"}`}>
                {item.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
                {item.ok ? tl.support.yes : tl.support.no}
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Lightbulb className="h-5 w-5" />
          </span>
          <h2 className="font-semibold text-gray-900">{tl.howItWorksTitle}</h2>
        </div>
        <ul className="list-disc space-y-1 ps-5 text-xs leading-relaxed text-gray-600">
          {tl.howItWorks.map((line) => <li key={line}>{line}</li>)}
        </ul>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-2 flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600">
            <Volume2 className="h-5 w-5" />
          </span>
          <h2 className="font-semibold text-gray-900">{tl.audioSupportTitle}</h2>
        </div>
        <p className="text-xs leading-relaxed text-gray-600">{tl.audioSupportBody}</p>
      </section>
    </aside>
  );
}
