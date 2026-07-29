// Plain-language checklist for what the identity-verification AI actually
// needs from a face photo to produce a reliable match later (frontal face,
// even lighting, unobstructed, in focus). Shared by every upload point that
// feeds a photo into that pipeline (passport document, profile photo) so the
// guidance stays consistent if it's ever revised.
export const PASSPORT_PHOTO_GUIDELINES = [
  "Face clearly visible, looking straight at the camera",
  "Well-lit, no strong shadows or glare",
  "No sunglasses, hats, or anything covering your face",
  "Only your face in the photo — no one else",
  "Sharp and in focus, not blurry",
  "A recent photo that looks like you now",
];
