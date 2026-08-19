import { test, expect } from "@playwright/test";
import { LIVE_CALL_SESSION_ID, LIVE_CALL_SESSION_TOKEN } from "./fixtures";

// The fixture session is scheduled far in the future (see fixtures.ts /
// e2e/README.md) specifically so this stays outside the 15-minute
// early-join window (LIVE_CALL_EARLY_JOIN_MINUTES) no matter when the
// suite runs - a near-future timestamp would drift stale within minutes.
//
// Real getUserMedia (camera/mic) capture isn't reliably automatable in a
// headless browser - confirmed during manual investigation this session
// (Chromium's fake-device flags don't satisfy the live-call join flow's
// media acquisition step) - so an actual in-progress call can't be
// exercised here; only routing and copy up to that boundary.

test("a session scheduled far in the future shows the waiting screen with its start time", async ({
  page,
}) => {
  await page.goto(`/en/interview?sessionId=${LIVE_CALL_SESSION_ID}&token=${LIVE_CALL_SESSION_TOKEN}`);

  await expect(page.getByText(/your interview is scheduled/i)).toBeVisible({ timeout: 15_000 });
});

test.skip(
  "the live-interview banner shows once inside the early-join window",
  async () => {
    // TODO: the isLiveCall banner (precheck-flow.tsx) only renders once a
    // session is within LIVE_CALL_EARLY_JOIN_MINUTES of scheduled_start_at
    // - a moving target that can't be represented as a static fixture like
    // the one above without going stale within minutes. Needs a helper
    // that reschedules a session to "now + a few minutes" via the staff
    // API right before this test runs, then asserts
    // getByText(/live interview/i) is visible.
  }
);
