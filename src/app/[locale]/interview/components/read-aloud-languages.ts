// Mirrors the backend's LANGUAGE_CODE_MAP (api/sessions/services.py) - keep
// these in sync. TTS_VOICE_MAP on the backend has a specific voice mapped
// for each of these except Arabic, where the provider is left to pick an
// appropriate default voice for the language on its own.
export const READ_ALOUD_LANGUAGES = [
  { code: "en-US", label: "English" },
  { code: "es-ES", label: "Spanish" },
  { code: "fr-FR", label: "French" },
  { code: "ar-SA", label: "Arabic" },
  { code: "de-DE", label: "German" },
  { code: "zh-CN", label: "Chinese" },
];
