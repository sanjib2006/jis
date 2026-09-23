import { test, expect } from "@playwright/test";

test.describe("Lawyer Dashboard, Billing & Case History E2E (FR4, FR19, TC3)", () => {
  test("Redirects unauthenticated lawyer history access to login", async ({ page }) => {
    await page.goto("/lawyer/history");
    await expect(page).toHaveURL(/\/login/);
  });

  test("Redirects unauthenticated lawyer billing access to login", async ({ page }) => {
    await page.goto("/lawyer/billing");
    await expect(page).toHaveURL(/\/login/);
  });
});
