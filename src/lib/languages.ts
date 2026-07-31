// Mirrors the backend's Languages class and LANGUAGE_CODE_MAP
// (api/core/constants.py, api/sessions/services.py) - the two previously
// drifted (this list used to also offer Russian/Portuguese, which the
// backend never accepted, so submitting either would fail validation).
// Keep all three in sync when this changes. `code` is the BCP-47 code used
// for anything sent to the TTS/STT providers (read-aloud language,
// answer-recording language); `key`/`label` are for the plain candidate/
// account-level language selects that only deal in the short code.
export const LANGUAGES = [
  { key: "EN", label: "English", code: "en-US" },
  { key: "AR", label: "Arabic", code: "ar-SA" },
  { key: "AM", label: "Amharic", code: "am-ET" },
  { key: "OM", label: "Afaan Oromo", code: "om-ET" },
  { key: "FIL", label: "Filipino", code: "fil-PH" },
  { key: "ZH", label: "Chinese", code: "zh-CN" },
];
