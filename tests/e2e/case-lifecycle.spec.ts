import { test, expect } from "@playwright/test";

test.describe("Case Lifecycle & Courtroom Operations E2E (FR6 - FR17)", () => {
  test("Redirects unauthenticated case registration to login", async ({ page }) => {
    await page.goto("/registrar/cases/new");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Redirects unauthenticated courtroom access to login", async ({ page }) => {
    await page.goto("/registrar/courtrooms");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Redirects unauthenticated hearing scheduling to login", async ({ page }) => {
    await page.goto("/registrar/hearings");
    await expect(page).toHaveURL(/\/login/);
  });
});
