import { expect, test } from "@playwright/test";

test.describe("dashboard smoke", () => {
  test("dashboard rendering and engagement-scoping", async ({ page }) => {
    // Navigate to Dashboard
    await page.goto("/dashboard");

    // Verify main heading
    await expect(
      page.getByRole("heading", {
        name: /intelligence for good analyst console/i,
      }),
    ).toBeVisible();

    // Verify Engagement completion and other metrics are present
    // These strings might be rendered in KpiCard component
    await expect(page.getByText(/engagement completion/i)).toBeVisible();

    // Verify activity feed or alerts section
    await expect(
      page.getByRole("heading", { name: /alerts & escalations/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /activity feed/i }),
    ).toBeVisible();
  });
});
