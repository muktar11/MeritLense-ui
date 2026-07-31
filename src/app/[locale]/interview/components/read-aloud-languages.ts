// Mirrors the backend's LANGUAGE_CODE_MAP (api/sessions/services.py) - keep
// these in sync. Deliberately excludes Afaan Oromo (om-ET): confirmed
// directly against the TTS provider that it isn't a supported voice
// (400 "Voice does not exist"), so it's never offered here even though it's
// a selectable interview/candidate language elsewhere. TTS_VOICE_MAP on the
// backend has a specific voice mapped for English/Chinese only - Arabic,
// Amharic, and Filipino are left to the provider's own default voice for
// that language.
export const READ_ALOUD_LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "ar-SA", label: "Arabic" },
  { code: "am-ET", label: "Amharic" },
  { code: "fil-PH", label: "Filipino" },
  { code: "zh-CN", label: "Chinese" },
];
