// Strings for the interview's language features (original + translated
// question, answer language, audio support, timer card). The interface
// chrome is English or Arabic (session.ui_language); question content can
// be shown in any supported language.
import { LANGUAGES } from "@/lib/languages";
import type { CandidateLanguage } from "./candidate-lang";

export interface LanguageStrings {
  originalLabel: (language: string) => string;
  approvedLabel: (language: string) => string;
  translationLabel: (language: string) => string;
  listenIn: (language: string) => string;
  stop: string;
  showIn: (language: string) => string;
  translating: string;
  translationUnavailable: (language: string) => string;
  audioUnavailable: (language: string) => string;
  yourLanguageTitle: string;
  yourLanguageHint: string;
  howItWorksTitle: string;
  howItWorks: string[];
  audioSupportTitle: string;
  audioSupportBody: string;
  support: { listen: string; record: string; translate: string; yes: string; no: string };
  yourAnswerTitle: (language: string) => string;
  yourAnswerHint: (language: string) => string;
  voiceSupported: (language: string) => string;
  voiceUnsupported: (language: string) => string;
  recordingIn: (language: string) => string;
  answerKept: string;
  timeRemaining: string;
  timeContinues: string;
  verbalTranslationLabel: (language: string) => string;
  statementTranslationUnavailable: (language: string) => string;
}

const EN: LanguageStrings = {
  originalLabel: (l) => `Original Question (${l})`,
  approvedLabel: (l) => `Approved Question (${l})`,
  translationLabel: (l) => `Translated Question (${l})`,
  listenIn: (l) => `Listen in ${l}`,
  stop: "Stop",
  showIn: (l) => `Show in ${l}`,
  translating: "Translating…",
  translationUnavailable: (l) => `Translation into ${l} isn't available right now. Please use the original question above.`,
  audioUnavailable: (l) => `Audio isn't available in ${l} on this device. Please read the text on screen.`,
  yourLanguageTitle: "Your Language",
  yourLanguageHint: "This is the language you will use to answer the questions. You can change it at any time.",
  howItWorksTitle: "How it works",
  howItWorks: [
    "Questions are from our approved bank (English and Arabic).",
    "They are automatically translated to your selected language.",
    "You can listen to the question in both languages.",
    "You can answer by voice or text, depending on language support.",
  ],
  audioSupportTitle: "Audio Support",
  audioSupportBody:
    "Audio is available in English and most supported languages. If audio is not available in your language, you can still read the question and answer by typing.",
  support: { listen: "Listen", record: "Voice answer", translate: "Translation", yes: "Available", no: "Not available" },
  yourAnswerTitle: (l) => `Your Answer (${l})`,
  yourAnswerHint: (l) => `Choose how you want to answer in ${l}.`,
  voiceSupported: (l) => `Voice recording is supported for ${l}.`,
  voiceUnsupported: (l) => `Voice recording isn't available for ${l}. Please type your answer.`,
  recordingIn: (l) => `Recording will be in: ${l}`,
  answerKept: "Your answer is kept when you change language or answer type.",
  timeRemaining: "Time Remaining",
  timeContinues: "Time will continue to run across all questions.",
  verbalTranslationLabel: (l) => `${l} (Translation)`,
  statementTranslationUnavailable: (l) => `Translation into ${l} isn't available right now. Please read the English statement above.`,
};

const AR: LanguageStrings = {
  originalLabel: (l) => `السؤال الأصلي (${l})`,
  approvedLabel: (l) => `السؤال المعتمد (${l})`,
  translationLabel: (l) => `السؤال المترجَم (${l})`,
  listenIn: (l) => `استمع بـ${l}`,
  stop: "إيقاف",
  showIn: (l) => `عرض بـ${l}`,
  translating: "جارٍ الترجمة…",
  translationUnavailable: (l) => `الترجمة إلى ${l} غير متاحة حاليًا. يُرجى الاعتماد على السؤال الأصلي أعلاه.`,
  audioUnavailable: (l) => `الصوت غير متاح بـ${l} على هذا الجهاز. يُرجى قراءة النص على الشاشة.`,
  yourLanguageTitle: "لغتك",
  yourLanguageHint: "هذه هي اللغة التي ستجيب بها عن الأسئلة. يمكنك تغييرها في أي وقت.",
  howItWorksTitle: "كيف يعمل التقييم",
  howItWorks: [
    "الأسئلة من بنك الأسئلة المعتمد (بالإنجليزية والعربية).",
    "تُترجَم تلقائيًا إلى اللغة التي تختارها.",
    "يمكنك الاستماع إلى السؤال باللغتين.",
    "يمكنك الإجابة بالصوت أو بالكتابة، حسب دعم اللغة.",
  ],
  audioSupportTitle: "دعم الصوت",
  audioSupportBody:
    "الصوت متاح بالإنجليزية ومعظم اللغات المدعومة. إذا لم يكن الصوت متاحًا بلغتك، يمكنك قراءة السؤال والإجابة بالكتابة.",
  support: { listen: "الاستماع", record: "الإجابة الصوتية", translate: "الترجمة", yes: "متاح", no: "غير متاح" },
  yourAnswerTitle: (l) => `إجابتك (${l})`,
  yourAnswerHint: (l) => `اختر طريقة الإجابة بـ${l}.`,
  voiceSupported: (l) => `التسجيل الصوتي مدعوم بـ${l}.`,
  voiceUnsupported: (l) => `التسجيل الصوتي غير متاح بـ${l}. يُرجى كتابة إجابتك.`,
  recordingIn: (l) => `سيكون التسجيل بـ: ${l}`,
  answerKept: "تُحفَظ إجابتك عند تغيير اللغة أو طريقة الإجابة.",
  timeRemaining: "الوقت المتبقي",
  timeContinues: "يستمر احتساب الوقت عبر جميع الأسئلة.",
  verbalTranslationLabel: (l) => `${l} (ترجمة)`,
  statementTranslationUnavailable: (l) => `الترجمة إلى ${l} غير متاحة حاليًا. يُرجى قراءة النص الأصلي أعلاه.`,
};

export function getLanguageStrings(language: CandidateLanguage): LanguageStrings {
  return language === "ar" ? AR : EN;
}

export type LanguageInfo = (typeof LANGUAGES)[number];

export function languageByKey(key?: string | null): LanguageInfo | undefined {
  const k = (key ?? "").split("-")[0].toUpperCase();
  return LANGUAGES.find((lang) => lang.key === k);
}

export function languageByCode(code?: string | null): LanguageInfo | undefined {
  return LANGUAGES.find((lang) => lang.code === code) ?? languageByKey(code);
}

/** Language name in the interface language, e.g. "Amharic (አማርኛ)" / "الأمهرية". */
export function languageName(key: string, uiLanguage: CandidateLanguage): string {
  const info = languageByKey(key);
  const base = (info?.code ?? key).split("-")[0].toLowerCase();
  let display = info?.label ?? key;
  try {
    display = new Intl.DisplayNames([uiLanguage], { type: "language" }).of(base) ?? display;
  } catch {
    // Older browsers: keep the English label.
  }
  if (uiLanguage === "en" && !["en", "ar"].includes(base)) {
    try {
      const native = new Intl.DisplayNames([base], { type: "language" }).of(base);
      if (native && native.toLowerCase() !== display.toLowerCase()) return `${display} (${native})`;
    } catch {
      // No native name available.
    }
  }
  return display;
}
