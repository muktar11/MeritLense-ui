import { test, expect } from "@playwright/test";
import { loginAsQaAdmin } from "./helpers";

test("admin dashboard loads without error after login", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (err) => errors.push(err.message));

  await loginAsQaAdmin(page);

  await expect(page.getByText(/something went wrong/i)).toHaveCount(0);
  expect(errors, `Unexpected client-side errors: ${errors.join("; ")}`).toEqual([]);
});

test("session survives a reload (token persisted correctly)", async ({ page }) => {
  await loginAsQaAdmin(page);
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard\/admin/);
  const accessToken = await page.evaluate(() => localStorage.getItem("accessToken"));
  expect(accessToken).toBeTruthy();
});
