/**
 * Tests for the SSI investigate API proxy dedup field passthrough.
 * @see src/app/api/ssi/investigate/route.ts
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockApiFetch = vi.fn();
vi.mock("@/lib/server/api-client", () => ({
  apiFetch: (...args: unknown[]) => mockApiFetch(...args),
}));

vi.mock("@/lib/server/ssi-proxy", () => ({
  resolveSsiUrl: () => "http://ssi:8100",
  ssiHeaders: async () => ({}),
}));

beforeEach(() => {
  vi.stubEnv("I4G_API_URL", "https://api.test");
  mockApiFetch.mockReset();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SSI investigate proxy – dedup passthrough", () => {
  it("passes dedup fields through when core returns alreadyInvestigated", async () => {
    mockApiFetch.mockResolvedValueOnce({
      taskId: null,
      status: "skipped",
      message: "URL already investigated (fresh_scan_exists)",
      triggered: false,
      alreadyInvestigated: true,
      existingScanId: "scan-abc-123",
      existingRiskScore: 87.5,
      daysSinceScan: 3,
      reason: "fresh_scan_exists",
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://scam.example.com" }),
    });

    const res = await POST(request as never);
    const body = await res.json();

    expect(body.alreadyInvestigated).toBe(true);
    expect(body.triggered).toBe(false);
    expect(body.existingScanId).toBe("scan-abc-123");
    expect(body.existingRiskScore).toBe(87.5);
    expect(body.daysSinceScan).toBe(3);
    expect(body.reason).toBe("fresh_scan_exists");
    expect(body.status).toBe("skipped");
  });

  it("omits dedup fields when core returns a normal triggered response", async () => {
    mockApiFetch.mockResolvedValueOnce({
      taskId: "task-xyz",
      status: "accepted",
      message: "Investigation started",
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://new-site.example.com" }),
    });

    const res = await POST(request as never);
    const body = await res.json();

    expect(body.investigation_id).toBe("task-xyz");
    expect(body.status).toBe("accepted");
    expect(body.alreadyInvestigated).toBeUndefined();
    expect(body.existingScanId).toBeUndefined();
  });

  it("forwards the force flag to the core payload", async () => {
    mockApiFetch.mockResolvedValueOnce({
      taskId: "task-forced",
      status: "accepted",
      message: "Investigation started (forced)",
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://scam.example.com", force: true }),
    });

    await POST(request as never);

    expect(mockApiFetch).toHaveBeenCalledWith(
      "/investigations/ssi",
      expect.objectContaining({
        body: expect.stringContaining('"force":true'),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// proxyToSsi path (SSI_API_URL set — local dev / direct SSI)
// ---------------------------------------------------------------------------

describe("SSI investigate proxy – SSI direct path dedup", () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubEnv("SSI_API_URL", "http://ssi:8100");
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("passes dedup fields through when SSI returns already_investigated", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        scan_id: null,
        status: "skipped",
        already_investigated: true,
        existing_scan_id: "scan-ssi-dedup",
        existing_risk_score: 72.0,
        days_since_scan: 1,
        reason: "fresh_scan_exists",
      }),
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://scam.example.com" }),
    });

    const res = await POST(request as never);
    const body = await res.json();

    expect(body.alreadyInvestigated).toBe(true);
    expect(body.triggered).toBe(false);
    expect(body.existingScanId).toBe("scan-ssi-dedup");
    expect(body.existingRiskScore).toBe(72.0);
    expect(body.daysSinceScan).toBe(1);
    expect(body.reason).toBe("fresh_scan_exists");
  });

  it("omits dedup fields for a normal SSI response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        scan_id: "scan-new-ssi",
        status: "accepted",
      }),
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://new.example.com" }),
    });

    const res = await POST(request as never);
    const body = await res.json();

    expect(body.investigation_id).toBe("scan-new-ssi");
    expect(body.status).toBe("accepted");
    expect(body.alreadyInvestigated).toBeUndefined();
  });

  it("forwards force flag to SSI service", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 202,
      json: async () => ({
        scan_id: "scan-forced-ssi",
        status: "accepted",
      }),
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://scam.example.com", force: true }),
    });

    await POST(request as never);

    const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(sentBody.force).toBe(true);
  });
});
