/**
 * Tests for the SSI investigate API proxy dedup field passthrough.
 *
 * All investigation requests are routed through Core API
 * (`POST /investigations/ssi`). There is no direct-to-SSI path for
 * investigation lifecycle routes.
 *
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

  it("routes through core even when SSI_API_URL is set", async () => {
    vi.stubEnv("SSI_API_URL", "http://ssi:8100");

    mockApiFetch.mockResolvedValueOnce({
      taskId: "task-via-core",
      status: "accepted",
      message: "Investigation started",
    });

    const { POST } = await import("@/app/api/ssi/investigate/route");
    const request = new Request("http://localhost/api/ssi/investigate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "https://scam.example.com" }),
    });

    const res = await POST(request as never);
    const body = await res.json();

    // Should always go through apiFetch (core), not direct SSI fetch
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/investigations/ssi",
      expect.anything(),
    );
    expect(body.investigation_id).toBe("task-via-core");
  });
});
