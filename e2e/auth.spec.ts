import { test, expect } from "@playwright/test";
import { QA_ADMIN_EMAIL, QA_ADMIN_PASSWORD } from "./fixtures";

test("staff can log in and land on the admin dashboard", async ({ page }) => {
  await page.goto("/en/auth/login");

  await page.locator("#email").fill(QA_ADMIN_EMAIL);
  await page.locator("#password").fill(QA_ADMIN_PASSWORD);
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/dashboard\/admin/, { timeout: 15_000 });

  const accessToken = await page.evaluate(() => localStorage.getItem("accessToken"));
  expect(accessToken).toBeTruthy();
});

test("rejects a wrong password without navigating away", async ({ page }) => {
  await page.goto("/en/auth/login");

  await page.locator("#email").fill(QA_ADMIN_EMAIL);
  await page.locator("#password").fill("definitely-wrong-password");
  await page.getByRole("button", { name: "Sign In" }).click();

  await expect(page).toHaveURL(/\/auth\/login/);
  await expect(page.getByText(/no active account found/i)).toBeVisible({ timeout: 10_000 });
});
