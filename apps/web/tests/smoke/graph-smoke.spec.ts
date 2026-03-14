import { expect, test } from "@playwright/test";

test.describe("graph + Sprint 4 views smoke", () => {
  test("network graph → seed → expand", async ({ page }) => {
    await page.goto("/intelligence/graph");

    // Input and legend visible
    await expect(page.getByPlaceholder("entity_type:value")).toBeVisible();
    await expect(page.getByText(/entity types/i)).toBeVisible();

    // Canvas renders
    const canvas = page.locator("canvas");
    await expect(canvas).toBeVisible();

    // Enter a seed and search
    await page.getByPlaceholder("entity_type:value").fill("wallet:0xABC");
    await page
      .locator("button")
      .filter({ has: page.locator("[data-testid='icon-search'], svg") })
      .first()
      .click();

    // Wait for graph API response
    await page.waitForResponse(
      (resp) => resp.url().includes("/api/intelligence/graph"),
      { timeout: 10000 },
    );
  });

  test("timeline view loads track data", async ({ page }) => {
    await page.goto("/intelligence/timeline");

    // Period and granularity controls visible
    await expect(page.getByText("90d")).toBeVisible();
    await expect(page.getByText("week")).toBeVisible();

    // Wait for timeline API response
    await page.waitForResponse(
      (resp) => resp.url().includes("/api/intelligence/timeline"),
      { timeout: 10000 },
    );

    // Track names should appear after data loads
    await expect(page.getByText(/cases/i).first()).toBeVisible({
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
    await expect(page.getByText("90d")).toBeVisible();
    await expect(page.getByText("30d")).toBeVisible();

    // Summary stats should appear after data loads
    await expect(page.getByText("Countries")).toBeVisible({ timeout: 10000 });
    await expect(page.getByText("Total Cases")).toBeVisible();
    await expect(page.getByText("Total Loss")).toBeVisible();
  });
});
