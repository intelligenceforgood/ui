import { describe, expect, it } from "vitest";
import { mapHistoryEvent } from "@/lib/server/reviews-service.helpers";

describe("mapHistoryEvent", () => {
  it("unwraps nested request payloads", () => {
    const event = mapHistoryEvent({
      action_id: "history-123",
      actor: "analyst",
      created_at: "2025-12-02T00:00:00Z",
      payload: {
        request: {
          payload: {
            query: "romance scam",
            classifications: ["romance_scam"],
            datasets: ["intake"],
          },
        },
        results_count: 5,
        total: 25,
      },
    });

    expect(event.query).toBe("romance scam");
    expect(event.classification).toBe("romance_scam");
    expect(event.params.query).toBe("romance scam");
    expect(event.params.datasets).toEqual(["intake"]);
  });

  it("parses JSON string requests", () => {
    const event = mapHistoryEvent({
      action_id: "history-456",
      payload: {
        request: JSON.stringify({
          payload: {
            text: "wallet",
            taxonomy: ["crypto"],
          },
        }),
      },
    });

    expect(event.query).toBe("wallet");
    expect(event.classification).toBe("crypto");
  });

  it("extracts query text from standard action payloads", () => {
    const event = mapHistoryEvent({
      action_id: "history-standard",
      payload: {
        search_id: "search:abc",
        request: {
          text: "BEC Mule",
          classifications: [],
          datasets: [],
          entities: [],
          time_range: null,
          limit: 10,
          vector_limit: 10,
          structured_limit: 10,
          offset: 0,
        },
      },
    });

    expect(event.query).toBe("BEC Mule");
    expect(event.params.text).toBe("BEC Mule");
  });

  it("captures saved search metadata when present", () => {
    const event = mapHistoryEvent({
      action_id: "history-saved",
      payload: {
        saved_search_id: "saved:wallets",
        saved_search_name: "High-risk wallets",
        saved_search_owner: "analyst_1",
        saved_search_tags: ["wallets", "crypto"],
        request: {
          payload: {
            query: "wallet",
            saved_search_id: "saved:wallets",
          },
        },
      },
    });

    expect(event.savedSearch).toEqual({
      id: "saved:wallets",
      name: "High-risk wallets",
      owner: "analyst_1",
      tags: ["wallets", "crypto"],
    });
  });
});
