import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createApiKey,
  listApiKeys,
  revokeApiKey,
  adminListApiKeys,
  adminRevokeApiKey,
  createPartnerKey,
} from "./api-keys";

const apiFetchMock = vi.fn();

vi.mock("@/lib/server/api-client", () => ({
  apiFetch: (...args: unknown[]) => apiFetchMock(...args),
}));

describe("api-keys service functions", () => {
  beforeEach(() => {
    apiFetchMock.mockReset();
  });

  it("createApiKey calls POST /api-keys with payload", async () => {
    const expectedResponse = {
      rawKey: "uk_live_12345",
      keyId: "key-1",
      keyPrefix: "uk_live",
      expiresAt: null,
    };
    apiFetchMock.mockResolvedValueOnce(expectedResponse);

    const result = await createApiKey({
      description: "Test key",
      expiresInDays: 30,
    });

    expect(apiFetchMock).toHaveBeenCalledWith("/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        description: "Test key",
        expires_in_days: 30,
      }),
    });
    expect(result).toEqual(expectedResponse);
  });

  it("listApiKeys calls GET /api-keys", async () => {
    const expectedResponse = { keys: [] };
    apiFetchMock.mockResolvedValueOnce(expectedResponse);

    const result = await listApiKeys();

    expect(apiFetchMock).toHaveBeenCalledWith("/api-keys");
    expect(result).toEqual(expectedResponse);
  });

  it("revokeApiKey calls DELETE /api-keys/{keyId}", async () => {
    apiFetchMock.mockResolvedValueOnce(undefined);

    await revokeApiKey("key-123");

    expect(apiFetchMock).toHaveBeenCalledWith("/api-keys/key-123", {
      method: "DELETE",
    });
  });

  it("adminListApiKeys calls GET /admin/api-keys with query params", async () => {
    const expectedResponse = { keys: [] };
    apiFetchMock.mockResolvedValueOnce(expectedResponse);

    const result = await adminListApiKeys("partner", true);

    expect(apiFetchMock).toHaveBeenCalledWith("/admin/api-keys", {
      queryParams: { key_type: "partner", active_only: "true" },
    });
    expect(result).toEqual(expectedResponse);
  });

  it("adminRevokeApiKey calls DELETE /admin/api-keys/{keyId}", async () => {
    apiFetchMock.mockResolvedValueOnce(undefined);

    await adminRevokeApiKey("key-999");

    expect(apiFetchMock).toHaveBeenCalledWith("/admin/api-keys/key-999", {
      method: "DELETE",
    });
  });

  it("createPartnerKey calls POST /admin/api-keys/partner with payload", async () => {
    const expectedResponse = {
      rawKey: "pk_partner_12345",
      keyId: "partner-1",
      keyPrefix: "pk_part",
      expiresAt: "2027-01-01T00:00:00Z",
    };
    apiFetchMock.mockResolvedValueOnce(expectedResponse);

    const result = await createPartnerKey({
      partnerName: "Acme Corp",
      ownerEmail: "partner@acme.com",
      rateLimitPerMinute: 120,
    });

    expect(apiFetchMock).toHaveBeenCalledWith("/admin/api-keys/partner", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        partner_name: "Acme Corp",
        owner_email: "partner@acme.com",
        rate_limit_per_minute: 120,
      }),
    });
    expect(result).toEqual(expectedResponse);
  });
});
