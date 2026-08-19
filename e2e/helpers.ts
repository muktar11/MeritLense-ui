import { Page, expect } from "@playwright/test";
import { QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD } from "./fixtures";

export async function loginAsQaAdmin(page: Page) {
  await page.goto("/en/auth/login");
  await page.locator("#email").fill(QA_ADMIN_EMAIL);
  await page.locator("#password").fill(QA_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();
  await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 15_000 });
}
