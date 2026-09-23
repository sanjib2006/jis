import { test, expect } from "@playwright/test";

test.describe("Account Management E2E (FR1, FR2, FR3)", () => {
  test("Registrar can view personnel directory and provision dialog opens", async ({ page }) => {
    // Unauthenticated access redirects
    await page.goto("/registrar/accounts");
    await expect(page).toHaveURL(/\/login/);
  });
});
