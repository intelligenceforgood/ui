import { expect, test } from "@playwright/test";

test.describe("graph + Sprint 4 views smoke", () => {
  test("network graph → seed → expand", async ({ page }) => {
    const responsePromise = page.waitForResponse(
      (resp) => resp.url().includes("/api/intelligence/graph"),
      { timeout: 10000 },
    );
    await page.goto("/intelligence/graph?seed_type=wallet&seed_value=0xABC");

    // Input and legend visible
    await expect(
      page.getByRole("heading", { name: /graph controls/i }),
    ).toBeVisible();
    await expect(page.getByLabel(/entity type/i)).toBeVisible();
    await expect(page.getByPlaceholder("Enter value…")).toBeVisible();
    await expect(page.getByText(/entity types/i)).toBeVisible();

    // Canvas renders
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Seeded graph request fires on load
    await expect(page.getByLabel(/entity type/i).locator("option")).toHaveCount(
      12,
      {
        timeout: 10000,
      },
    );
    await responsePromise;
  });

  test("timeline view loads track data", async ({ page }) => {
    await page.goto("/intelligence/timeline");

    // Period and granularity controls visible
    await expect(
      page.getByRole("button", { name: "90d", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "week", exact: true }),
    ).toBeVisible();

    // Track names should appear after data loads
    await expect(
      page.getByRole("heading", { name: "cases", exact: true }),
    ).toBeVisible({
      timeout: 10000,
    });
  });

  test("taxonomy explorer loads sankey view", async ({ page }) => {
    await page.goto("/impact/taxonomy-explorer");

    // View mode buttons visible
    await expect(page.getByText("Sankey")).toBeVisible();
    await expect(page.getByText("Heatmap")).toBeVisible();
    await expect(page.getByText("Trend")).toBeVisible();

    // Wait for sankey data
    await page.waitForResponse(
      (resp) => resp.url().includes("/api/impact/taxonomy/sankey"),
      { timeout: 10000 },
    );
  });

  test("geography view loads country summary", async ({ page }) => {
    await page.goto("/impact/geography");

    // Period controls visible
    await expect(
      page.getByRole("button", { name: "90d", exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "30d", exact: true }),
    ).toBeVisible();

    // Summary stats should appear after data loads
    await expect(
      page.getByText("Countries", { exact: true }).first(),
    ).toBeVisible({ timeout: 10000 });
    await expect(
      page.getByText("Total Cases", { exact: true }).first(),
    ).toBeVisible();
    await expect(
      page.getByText("Total Loss", { exact: true }).first(),
    ).toBeVisible();
  });
});
