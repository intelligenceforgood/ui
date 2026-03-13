import { expect, test } from "@playwright/test";

test.describe("intelligence smoke", () => {
  test("entity explorer → view detail → export CSV", async ({ page }) => {
    // Navigate to Entity Explorer
    await page.goto("/intelligence/entities");

    // Page heading visible
    await expect(
      page.getByRole("heading", { name: /entity explorer/i }),
    ).toBeVisible();

    // Search input is visible
    await expect(page.getByPlaceholder(/search entities/i)).toBeVisible();

    // Filter sidebar is present
    await expect(page.getByText(/entity type/i).first()).toBeVisible();

    // Export CSV link is present
    const exportLink = page.getByRole("link", { name: /export csv/i });
    await expect(exportLink).toBeVisible();

    // Wait for table to load (entities should appear)
    // Use a generous timeout since data relies on the backend
    const firstRow = page.locator("tr").nth(1);
    await expect(firstRow).toBeVisible({ timeout: 10000 });

    // Click the first entity row to open detail panel
    await firstRow.click();

    // Detail panel should appear with entity info
    await expect(page.getByText(/related cases/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test("indicator registry tab navigation", async ({ page }) => {
    await page.goto("/intelligence/indicators");

    await expect(
      page.getByRole("heading", { name: /indicator registry/i }),
    ).toBeVisible();

    // Segmentation tabs visible
    await expect(page.getByText("All")).toBeVisible();
    await expect(page.getByText("Bank")).toBeVisible();
    await expect(page.getByText("Crypto")).toBeVisible();

    // Click Bank tab
    await page.getByText("Bank").click();

    // Wait for re-fetch
    await page.waitForResponse(
      (resp) =>
        resp.url().includes("/intelligence/indicators") &&
        resp.url().includes("category=bank_account"),
    );
  });

  test("intelligence dashboard loads widgets", async ({ page }) => {
    await page.goto("/intelligence");

    await expect(
      page.getByRole("heading", { name: /intelligence dashboard/i }),
    ).toBeVisible();

    // Widget cards should be visible
    await expect(page.getByText(/active threats/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/new indicators/i)).toBeVisible();
  });

  test("old /accounts redirects to /intelligence/indicators", async ({
    page,
  }) => {
    await page.goto("/accounts");
    await page.waitForURL(/\/intelligence\/indicators/);
    expect(page.url()).toContain("/intelligence/indicators");
  });

  test("old /analytics redirects to /impact", async ({ page }) => {
    await page.goto("/analytics");
    await page.waitForURL(/\/impact/);
    expect(page.url()).toContain("/impact");
  });
});
