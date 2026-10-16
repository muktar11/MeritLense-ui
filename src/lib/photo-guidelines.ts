// Plain-language checklist for what the identity-verification AI actually
// needs from a face photo to produce a reliable match later (frontal face,
// even lighting, unobstructed, in focus). Shared by every upload point that
// feeds a photo into that pipeline (passport document, profile photo) so the
// guidance stays consistent if it's ever revised. The text is in
// messages/*/common.json under shared.photoGuidelines.
export const PASSPORT_PHOTO_GUIDELINE_KEYS = [
  "faceVisible",
  "wellLit",
  "nothingCovering",
  "onlyYou",
  "sharp",
  "recent",
] as const;
