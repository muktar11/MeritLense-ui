import { LANGUAGES } from "@/lib/languages";

// Filters on the `tts` flag, which is only ever set from a direct 200/400
// check against the Google TTS API (see api/sessions/services.py's
// LANGUAGE_CODE_MAP comments for the exact verification) - not assumed
// from "this is a supported candidate language" elsewhere. Several
// languages (Afaan Oromo, Somali, Malagasy, Tigrinya, Afar, Twi, Luganda)
// are selectable as an interview/candidate/answer language but have no
// working TTS voice, so they never appear here. TTS_VOICE_MAP on the
// backend has a specific voice mapped for English/Chinese only - the rest
// of the `tts: true` languages are left to the provider's own default
// voice for that language.
export const READ_ALOUD_LANGUAGES = LANGUAGES.filter((lang) => lang.tts).map((lang) => ({
  code: lang.code,
  label: lang.label,
}));
