import { defineConfig, devices } from "@playwright/test";

// Points at QA by default so `npx playwright test` works out of the box for
// any developer with no setup - override QA_BASE_URL to run against a local
// `npm run dev` instance (paired with a local backend) instead.
const baseURL = process.env.QA_BASE_URL || "https://qa.meritlense.com";

export default defineConfig({
  testDir: "./e2e",
  // The QA backend is a 2-worker gunicorn instance on a shared, memory-thin
  // VM (see the QA-environment plan) - unbounded parallel Playwright
  // workers reliably overwhelmed it and produced flaky timeouts/failed
  // logins in practice. Capped rather than left at the CPU-count default,
  // since this hits shared infra other developers may be using too.
  fullyParallel: false,
  workers: 2,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["html", { open: "never" }]] : "list",
  timeout: 60_000,
  use: {
    baseURL,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
