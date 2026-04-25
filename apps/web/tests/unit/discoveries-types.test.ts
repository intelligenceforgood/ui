import { describe, expect, it } from "vitest";
import type {
  DiscoveryRow,
  DiscoveryList,
  EnqueueResponse,
  DismissRequest,
} from "@/types/discoveries";

describe("discoveries types — round-trip field name sanity", () => {
  it("DiscoveryRow fields survive JSON round-trip with camelCase keys", () => {
    const row: DiscoveryRow = {
      discoveryId: "disc-1",
      domain: "evil-brand.com",
      seenAt: "2026-04-25T10:00:00Z",
      source: "merklemap",
      filterMatch: true,
      filterReason: "brand keyword",
      enqueuedScanId: null,
      dismissedAt: null,
      dismissReason: null,
    };
    const rt = JSON.parse(JSON.stringify(row)) as DiscoveryRow;
    expect(rt.discoveryId).toBe("disc-1");
    expect(rt.seenAt).toBe("2026-04-25T10:00:00Z");
    expect(rt.filterMatch).toBe(true);
    expect(rt.enqueuedScanId).toBeNull();
    expect(rt.dismissedAt).toBeNull();
  });

  it("DiscoveryList fields survive JSON round-trip", () => {
    const list: DiscoveryList = {
      items: [],
      total: 0,
      limit: 50,
      offset: 0,
    };
    const rt = JSON.parse(JSON.stringify(list)) as DiscoveryList;
    expect(rt.total).toBe(0);
    expect(rt.limit).toBe(50);
    expect(rt.offset).toBe(0);
    expect(Array.isArray(rt.items)).toBe(true);
  });

  it("EnqueueResponse fields survive JSON round-trip", () => {
    const resp: EnqueueResponse = {
      discoveryId: "disc-1",
      enqueuedScanId: "scan-abc",
    };
    const rt = JSON.parse(JSON.stringify(resp)) as EnqueueResponse;
    expect(rt.discoveryId).toBe("disc-1");
    expect(rt.enqueuedScanId).toBe("scan-abc");
  });

  it("DismissRequest field survives JSON round-trip", () => {
    const req: DismissRequest = { reason: "not relevant" };
    const rt = JSON.parse(JSON.stringify(req)) as DismissRequest;
    expect(rt.reason).toBe("not relevant");
  });
});
