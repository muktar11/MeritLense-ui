// Mirrors the backend's Languages class (api/core/constants.py) - the two
// previously drifted (this list used to also offer Russian/Portuguese,
// which the backend never accepted, so submitting either would fail
// validation). Keep both in sync when this changes.
export const LANGUAGES = [
  { key: "EN", label: "English" },
  { key: "AR", label: "Arabic" },
  { key: "AM", label: "Amharic" },
  { key: "OM", label: "Afaan Oromo" },
  { key: "FIL", label: "Filipino" },
  { key: "ZH", label: "Chinese" },
];
