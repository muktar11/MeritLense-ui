import { test, expect } from "@playwright/test";
import { ASYNC_SESSION_ID, ASYNC_SESSION_TOKEN } from "./fixtures";

// Candidate-facing precheck flow for a non-live (async) interview session.
// No login required - this is the public candidate link shape
// (?sessionId=...&token=...) documented in interview/page.tsx.

test("precheck flow renders for an async session, with no consent step", async ({ page }) => {
  await page.goto(`/en/interview?sessionId=${ASYNC_SESSION_ID}&token=${ASYNC_SESSION_TOKEN}`);

  // The consent step was deliberately removed from the flow (see
  // precheck-flow.tsx) - this asserts it stays removed rather than
  // silently reappearing in a future change.
  await expect(page.getByText(/candidate consent/i)).toHaveCount(0);

  // Async sessions should not show the live-interview banner that only
  // appears when session.scheduled_start_at is set.
  await expect(page.getByText(/live interview/i)).toHaveCount(0);

  // One of the real precheck steps should be visible within a reasonable
  // load time (privacy notice is first in the flow).
  await expect(page.getByText(/privacy/i).first()).toBeVisible({ timeout: 15_000 });
});
