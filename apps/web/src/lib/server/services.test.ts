/**
 * Tests for server-side service modules:
 *   - campaigns-service
 *   - taxonomy-service
 *   - reviews-service
 *
 * All tests mock `apiFetch` from api-client.ts to avoid real HTTP calls.
 * @see src/lib/server/
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Module mock — all services import apiFetch from "./api-client"
// ---------------------------------------------------------------------------

const apiFetchMock = vi.fn();

vi.mock("@/lib/server/api-client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
  resolveApiBase: () => "https://api.test",
  resolveApiKey: () => null,
}));

vi.mock("@/lib/server/auth-helpers", () => ({
  getIapHeaders: vi.fn().mockResolvedValue({}),
}));

vi.mock("@/config/schema", () => ({
  HYBRID_SEARCH_SCHEMA_SNAPSHOT: {
    indicatorTypes: ["wallet"],
    datasets: ["default"],
    classifications: ["scam"],
    lossBuckets: ["<10k"],
    timePresets: ["7d"],
    entityExamples: {},
  },
}));

beforeEach(() => {
  apiFetchMock.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ===========================================================================
// campaigns-service
// ===========================================================================

describe("campaigns-service", () => {
  it("listCampaigns calls apiFetch with GET /campaigns", async () => {
    const campaigns = [{ id: "c1", name: "Campaign 1", taxonomy_rollup: [] }];
    apiFetchMock.mockResolvedValueOnce(campaigns);

    const { listCampaigns } = await import("@/lib/server/campaigns-service");
    const result = await listCampaigns();

    expect(apiFetchMock).toHaveBeenCalledWith("/campaigns");
    expect(result).toEqual(campaigns);
  });

  it("createCampaign POSTs the payload", async () => {
    apiFetchMock.mockResolvedValueOnce("new-id");

    const { createCampaign } = await import("@/lib/server/campaigns-service");
    const payload = {
      name: "Test",
      description: "desc",
      taxonomy_labels: {},
      associated_taxonomy_ids: [],
    };
    const result = await createCampaign(payload);

    expect(apiFetchMock).toHaveBeenCalledWith("/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    expect(result).toBe("new-id");
  });

  it("updateCampaign PATCHes /campaigns/:id", async () => {
    apiFetchMock.mockResolvedValueOnce(undefined);

    const { updateCampaign } = await import("@/lib/server/campaigns-service");
    await updateCampaign("c1", { name: "Updated" });

    expect(apiFetchMock).toHaveBeenCalledWith("/campaigns/c1", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Updated" }),
    });
  });
});

// ===========================================================================
// taxonomy-service
// ===========================================================================

describe("taxonomy-service", () => {
  it("getTaxonomyTree calls apiFetch with /taxonomy", async () => {
    const tree = { classifications: ["romance_scam"], datasets: ["alpha"] };
    apiFetchMock.mockResolvedValueOnce(tree);

    const { getTaxonomyTree } = await import("@/lib/server/taxonomy-service");
    const result = await getTaxonomyTree();

    expect(apiFetchMock).toHaveBeenCalledWith("/taxonomy");
    expect(result).toEqual(tree);
  });
});

// ===========================================================================
// reviews-service
// ===========================================================================

describe("reviews-service", () => {
  describe("getSearchHistory", () => {
    it("returns mapped history events", async () => {
      apiFetchMock.mockResolvedValueOnce({
        events: [
          {
            action_id: "h1",
            action: "search",
            timestamp: "2025-01-01T00:00:00Z",
            payload: {
              text: "wallet scam",
              classifications: ["romance_scam"],
              total: 5,
            },
            actor: "analyst",
          },
        ],
      });

      const { getSearchHistory } = await import("@/lib/server/reviews-service");
      const result = await getSearchHistory(10);

      expect(apiFetchMock).toHaveBeenCalledWith("/reviews/search/history", {
        queryParams: { limit: "10" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].query).toBe("wallet scam");
    });

    it("returns empty array on fetch error", async () => {
      apiFetchMock.mockRejectedValueOnce(new Error("server down"));

      const { getSearchHistory } = await import("@/lib/server/reviews-service");
      const result = await getSearchHistory();

      expect(result).toEqual([]);
    });

    it("returns empty array when payload is not an object", async () => {
      apiFetchMock.mockResolvedValueOnce(null);

      const { getSearchHistory } = await import("@/lib/server/reviews-service");
      const result = await getSearchHistory();

      expect(result).toEqual([]);
    });
  });

  describe("getHybridSearchSchema", () => {
    it("returns mapped schema from API", async () => {
      apiFetchMock.mockResolvedValueOnce({
        indicator_types: ["phone", "wallet"],
        datasets: ["ds1"],
        classifications: ["pig_butchering"],
        lossBuckets: ["<10k", "10k-50k"],
        time_presets: ["7d", "30d"],
        entity_examples: { phone: ["555-1234"] },
      });

      const { getHybridSearchSchema } = await import(
        "@/lib/server/reviews-service"
      );
      const schema = await getHybridSearchSchema();

      expect(schema.indicatorTypes).toContain("phone");
      expect(schema.indicatorTypes).toContain("wallet");
      expect(schema.datasets).toEqual(["ds1"]);
    });

    it("falls back to snapshot on error", async () => {
      apiFetchMock.mockRejectedValueOnce(new Error("timeout"));

      const { getHybridSearchSchema } = await import(
        "@/lib/server/reviews-service"
      );
      const schema = await getHybridSearchSchema();

      // Should match the mocked HYBRID_SEARCH_SCHEMA_SNAPSHOT
      expect(schema.indicatorTypes).toEqual(["wallet"]);
      expect(schema.datasets).toEqual(["default"]);
    });
  });

  describe("listSavedSearches", () => {
    it("returns mapped saved searches", async () => {
      apiFetchMock.mockResolvedValueOnce({
        items: [
          {
            id: "ss1",
            name: "My Search",
            owner: "analyst",
            created_at: "2025-01-01T00:00:00Z",
            params: { text: "crypto" },
          },
        ],
      });

      const { listSavedSearches } = await import(
        "@/lib/server/reviews-service"
      );
      const result = await listSavedSearches({ limit: 5 });

      expect(apiFetchMock).toHaveBeenCalledWith("/reviews/search/saved", {
        queryParams: { limit: "5" },
      });
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("My Search");
    });

    it("returns empty array on error", async () => {
      apiFetchMock.mockRejectedValueOnce(new Error("not found"));

      const { listSavedSearches } = await import(
        "@/lib/server/reviews-service"
      );
      const result = await listSavedSearches();

      expect(result).toEqual([]);
    });

    it("passes owner_only param when requested", async () => {
      apiFetchMock.mockResolvedValueOnce({ items: [] });

      const { listSavedSearches } = await import(
        "@/lib/server/reviews-service"
      );
      await listSavedSearches({ ownerOnly: true });

      expect(apiFetchMock).toHaveBeenCalledWith("/reviews/search/saved", {
        queryParams: { limit: "10", owner_only: "true" },
      });
    });
  });
});
