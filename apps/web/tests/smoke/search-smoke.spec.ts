import { expect, test } from "@playwright/test";

test.describe("search smoke", () => {
  test("supports filters, entity builder, and saved searches", async ({
    page,
  }) => {
    await page.goto("/search");

    await expect(
      page.getByRole("heading", { name: /Search signals/i }),
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Search by entity, behaviour, or case ID"),
    ).toBeVisible();
    await expect(page.getByText(/Filters/i).first()).toBeVisible();

    await page.getByRole("button", { name: /Add entity filter/i }).click();
    const entityInput = page.getByPlaceholder(/Value|e\.g\./i).last();
    await entityInput.fill("021000021-123456789");
    const applyEntityButton = page.getByRole("button", {
      name: /Apply entity filters/i,
    });
    await expect(applyEntityButton).toBeEnabled();
    await applyEntityButton.click();
    await expect(page.getByText(/1 entity filter/i).first()).toBeVisible();

    const romancePreset = page.getByRole("button", { name: /Romance scam/i });
    await romancePreset.click();
    await expect(page.getByText(/Tag: romance_scam/i).first()).toBeVisible();

    const datasetChip = page.getByRole("button", { name: /network_smoke/i });
    await datasetChip.click();
    await expect(
      page.getByText(/Dataset: network_smoke/i).first(),
    ).toBeVisible();

    const savedSearchName = `Playwright smoke ${Date.now()}`;
    page.once("dialog", async (dialog) => {
      expect(dialog.type()).toBe("prompt");
      await dialog.accept(savedSearchName);
    });
    await page.getByRole("button", { name: /Save search/i }).click();
    await expect(
      page.getByText(new RegExp(`Saved "${savedSearchName}"`, "i")),
    ).toBeVisible();
  });
});
