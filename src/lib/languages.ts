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
  { key: "HI", label: "Hindi", code: "hi-IN" },
  { key: "UR", label: "Urdu", code: "ur-PK" },
  { key: "BN", label: "Bengali", code: "bn-BD" },
  { key: "TA", label: "Tamil", code: "ta-IN" },
  { key: "TE", label: "Telugu", code: "te-IN" },
  { key: "ML", label: "Malayalam", code: "ml-IN" },
  { key: "PA", label: "Punjabi", code: "pa-IN" },
  { key: "SI", label: "Sinhala", code: "si-LK" },
  { key: "ID", label: "Indonesian", code: "id-ID" },
  { key: "NE", label: "Nepali", code: "ne-NP" },
  { key: "SW", label: "Swahili", code: "sw-KE" },
  { key: "VI", label: "Vietnamese", code: "vi-VN" },
  { key: "KM", label: "Khmer", code: "km-KH" },
  { key: "MY", label: "Burmese", code: "my-MM" },
];
