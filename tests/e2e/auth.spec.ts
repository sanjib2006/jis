import { test, expect } from "@playwright/test";

test.describe("Authentication & Role Routing (NFR1, FR1)", () => {
  test("unauthenticated access to dashboard redirects to login", async ({ page }) => {
    await page.goto("/registrar");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to judge dashboard redirects to login", async ({ page }) => {
    await page.goto("/judge");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated access to lawyer dashboard redirects to login", async ({ page }) => {
    await page.goto("/lawyer");
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows inline form validation errors on empty submission", async ({ page }) => {
    await page.goto("/login");
    await page.click('button[type="submit"]');

    // Should display validation messages without submitting to backend
    await expect(page.locator("text=email")).toBeVisible();
  });

  test("displays error on invalid credentials", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "unregistered@court.gov.in");
    await page.fill("#password", "WrongPassword@123");
    await page.click('button[type="submit"]');

    // Should display server error
    await expect(
      page.locator("text=Invalid login credentials").or(page.locator("text=failed"))
    ).toBeVisible({ timeout: 10000 });
  });
});
