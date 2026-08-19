import { test, expect } from "@playwright/test";
import { LANGUAGES } from "../src/lib/languages";

// The "I speak" / "I want to hear" dropdowns (LiveCallRoom.tsx) only render
// once a call is active, which requires real getUserMedia camera/mic
// capture - not reliably automatable headless (confirmed during manual
// investigation this session: Chromium's fake-device flags don't satisfy
// the live-call join flow). So this checks the data layer every language
// selector is built from, not the rendered dropdown itself. Real
// per-language transcription/translation *accuracy* is a separate concern,
// covered by the backend's stt_language_audit.py-style script, not this
// suite - don't conflate the two.

test("every configured language has the fields the selectors depend on", () => {
  expect(LANGUAGES.length).toBeGreaterThan(0);

  for (const lang of LANGUAGES) {
    expect(lang.key, `missing key for ${JSON.stringify(lang)}`).toBeTruthy();
    expect(lang.label, `missing label for ${lang.key}`).toBeTruthy();
    expect(lang.code, `missing BCP-47 code for ${lang.key}`).toMatch(/^[a-z]{2,3}-[A-Z]{2}$/);
    expect(typeof lang.tts).toBe("boolean");
    expect(typeof lang.stt).toBe("boolean");
  }

  const codes = LANGUAGES.map((l) => l.code);
  expect(new Set(codes).size, "duplicate language codes would silently collide in the dropdown").toBe(
    codes.length
  );
});

test.skip(
  "the live-call language dropdowns render every configured language",
  async () => {
    // TODO: requires a real (non-headless, or headed-with-real-devices)
    // browser run against an in-progress call. Join a live call, open the
    // "I speak" / "I want to hear" <select> elements, and assert their
    // <option> labels match LANGUAGES exactly. See LiveCallRoom.tsx
    // around the "I speak"/"I want to hear" labels for the selectors.
  }
);
