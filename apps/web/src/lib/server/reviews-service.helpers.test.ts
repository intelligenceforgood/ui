import { afterEach, describe, expect, it, vi } from "vitest";
import {
  mapHistoryEvent,
  mapHybridSearchSchemaPayload,
  mapSavedSearch,
  toStringArray,
} from "./reviews-service.helpers";

describe("toStringArray", () => {
  it("returns trimmed array values when provided a string", () => {
    expect(toStringArray("alpha, beta , gamma")).toEqual(["alpha", "beta", "gamma"]);
  });

  it("filters non-string entries when provided an array", () => {
    expect(toStringArray(["primary", "", 42, "secondary"])).toEqual(["primary", "secondary"]);
  });

  it("returns an empty array for unsupported values", () => {
    expect(toStringArray(undefined)).toEqual([]);
  });
});

describe("mapHybridSearchSchemaPayload", () => {
  it("normalizes snake_case and camelCase payloads", () => {
    const payload = {
      indicator_types: "bank_account,phone",
      datasets: ["alpha", "beta"],
      classifications: "romance_scam",
      lossBuckets: ["<10k", "10k-50k"],
      time_presets: "7d,30d",
    };

    expect(mapHybridSearchSchemaPayload(payload)).toEqual({
      indicatorTypes: ["bank_account", "phone"],
      datasets: ["alpha", "beta"],
      classifications: ["romance_scam"],
      lossBuckets: ["<10k", "10k-50k"],
      timePresets: ["7d", "30d"],
      entityExamples: {},
    });
  });

  it("maps entity example dictionaries", () => {
    const payload = {
      indicator_types: ["ip_address"],
      datasets: [],
      classifications: [],
      lossBuckets: [],
      time_presets: [],
      entity_examples: {
        ip_address: ["203.0.113.25", 42, ""],
        email: "analyst@example.com",
      },
    };

    expect(mapHybridSearchSchemaPayload(payload)).toEqual({
      indicatorTypes: ["ip_address"],
      datasets: [],
      classifications: [],
      lossBuckets: [],
      timePresets: [],
      entityExamples: {
        ip_address: ["203.0.113.25"],
        email: ["analyst@example.com"],
      },
    });
  });
});

describe("mapHistoryEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("fills in fallback fields when data is missing", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_000_000);
    vi.spyOn(Math, "random").mockReturnValue(0.123);

    const event = mapHistoryEvent({
      payload: { text: "wallet", taxonomy: "romance_scam", total: 5 },
      actor: 42 as unknown as string,
    });

    expect(event.actor).toBe("analyst");
    expect(event.classification).toBe("romance_scam");
    expect(event.query).toBe("wallet");
    expect(event.id).toBe("history-1700000000000-123");
    expect(event.total).toBe(5);
  });
});

describe("mapSavedSearch", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("parses tags and falls back to defaults", () => {
    vi.spyOn(Date, "now").mockReturnValue(1_700_000_010_000);
    vi.spyOn(Math, "random").mockReturnValue(0.42);

    const record = mapSavedSearch({
      tags: "urgent, priority ",
      favorite: 0,
      params: { query: "romance" },
    });

    expect(record.tags).toEqual(["urgent", "priority"]);
    expect(record.favorite).toBe(false);
    expect(record.name).toBe("Saved search");
    expect(record.id).toBe("saved-1700000010000-420");
  });
});
