// Mirrors the backend's Languages class and LANGUAGE_CODE_MAP
// (api/core/constants.py, api/sessions/services.py) - the two previously
// drifted (this list used to also offer Russian/Portuguese, which the
// backend never accepted, so submitting either would fail validation).
// Keep all three in sync when this changes. `code` is the BCP-47 code used
// for anything sent to the TTS/STT providers (read-aloud language,
// answer-recording language); `key`/`label` are for the plain candidate/
// account-level language selects that only deal in the short code.
// `tts`/`stt` reflect what's actually been confirmed directly against the
// providers (Google TTS 200/400, Whisper's documented supported-language
// list) - not assumed from "this is a major language" - since providers
// frequently drop support for otherwise-common languages (e.g. no Google
// TTS voice for Somali or Malagasy despite both having Whisper support).
export const LANGUAGES = [
  { key: "EN", label: "English", code: "en-US", tts: true, stt: true },
  { key: "AR", label: "Arabic", code: "ar-SA", tts: true, stt: true },
  { key: "AM", label: "Amharic", code: "am-ET", tts: true, stt: true },
  { key: "OM", label: "Afaan Oromo", code: "om-ET", tts: false, stt: false },
  { key: "FIL", label: "Filipino", code: "fil-PH", tts: true, stt: true },
  { key: "ZH", label: "Chinese", code: "zh-CN", tts: true, stt: true },
  { key: "HI", label: "Hindi", code: "hi-IN", tts: true, stt: true },
  { key: "UR", label: "Urdu", code: "ur-PK", tts: true, stt: true },
  { key: "BN", label: "Bengali", code: "bn-BD", tts: true, stt: true },
  { key: "TA", label: "Tamil", code: "ta-IN", tts: true, stt: true },
  { key: "TE", label: "Telugu", code: "te-IN", tts: true, stt: true },
  { key: "ML", label: "Malayalam", code: "ml-IN", tts: true, stt: true },
  { key: "PA", label: "Punjabi", code: "pa-IN", tts: true, stt: true },
  { key: "SI", label: "Sinhala", code: "si-LK", tts: true, stt: true },
  { key: "ID", label: "Indonesian", code: "id-ID", tts: true, stt: true },
  { key: "NE", label: "Nepali", code: "ne-NP", tts: true, stt: true },
  { key: "SW", label: "Swahili", code: "sw-KE", tts: true, stt: true },
  { key: "VI", label: "Vietnamese", code: "vi-VN", tts: true, stt: true },
  { key: "KM", label: "Khmer", code: "km-KH", tts: true, stt: true },
  { key: "MY", label: "Burmese", code: "my-MM", tts: true, stt: true },
  { key: "TI", label: "Tigrinya", code: "ti-ET", tts: false, stt: false },
  { key: "SO", label: "Somali", code: "so-SO", tts: false, stt: true },
  { key: "AA", label: "Afar", code: "aa-DJ", tts: false, stt: false },
  { key: "AK", label: "Twi (Akan)", code: "ak-GH", tts: false, stt: false },
  { key: "LG", label: "Luganda", code: "lg-UG", tts: false, stt: false },
  { key: "MG", label: "Malagasy", code: "mg-MG", tts: false, stt: true },
];
