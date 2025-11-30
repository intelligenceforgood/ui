import { expect, test } from "@playwright/test";

test.describe("search smoke", () => {
  test("renders filters and actions", async ({ page }) => {
    await page.goto("/search");

    await expect(page.getByRole("heading", { name: /Search signals/i })).toBeVisible();
    await expect(page.getByPlaceholder("Search by entity, behaviour, or case ID")).toBeVisible();
    await expect(page.getByRole("button", { name: /Save search/i })).toBeVisible();
    await expect(page.getByText(/Filters/i).first()).toBeVisible();
  });
});
