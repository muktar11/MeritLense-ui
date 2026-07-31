import { LANGUAGES } from "@/lib/languages";

// Deliberately excludes Afaan Oromo: confirmed directly against the TTS
// provider that it isn't a supported voice (400 "Voice does not exist"),
// so it's never offered here even though it's a selectable interview/
// candidate language elsewhere. TTS_VOICE_MAP on the backend has a
// specific voice mapped for English/Chinese only - Arabic, Amharic, and
// Filipino are left to the provider's own default voice for that language.
export const READ_ALOUD_LANGUAGES = LANGUAGES.filter((lang) => lang.key !== "OM").map((lang) => ({
  code: lang.code,
  label: lang.label,
}));
