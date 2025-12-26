import { NextRequest, NextResponse } from "next/server";
import { getIapToken } from "@/lib/iap-token";

type RouteContext = {
  params: Promise<{ searchId: string }>;
};
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().trim().min(1).optional(),
  params: z.record(z.string(), z.unknown()).optional(),
  favorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
});

function resolveApiBase() {
  return (
    process.env.I4G_API_URL ?? process.env.NEXT_PUBLIC_API_BASE_URL ?? null
  );
}

function resolveApiKey() {
  return process.env.I4G_API_KEY ?? process.env.NEXT_PUBLIC_API_KEY ?? null;
}

async function buildHeaders() {
  const headers: Record<string, string> = { Accept: "application/json" };
  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }
  const iapClientId = process.env.I4G_IAP_CLIENT_ID;
  if (iapClientId) {
    const token = await getIapToken(iapClientId);
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid update payload", issues: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const baseUrl = resolveApiBase();
    if (!baseUrl) {
      return NextResponse.json({ updated: true, search_id: params.searchId });
    }

    const url = new URL(`/reviews/search/saved/${params.searchId}`, baseUrl);
    const baseHeaders = await buildHeaders();
    const headers = { ...baseHeaders, "Content-Type": "application/json" };

    const response = await fetch(url, {
      method: "PATCH",
      headers,
      body: JSON.stringify({
        name: parsed.data.name,
        params: parsed.data.params,
        favorite: parsed.data.favorite,
        tags: parsed.data.tags,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        typeof payload.detail === "string"
          ? payload.detail
          : "Failed to update saved search";
      return NextResponse.json(
        { error: errorMessage, details: payload },
        { status: response.status },
      );
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Update saved search proxy error", error);
    return NextResponse.json(
      { error: "Unable to update saved search" },
      { status: 500 },
    );
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const params = await context.params;
    const baseUrl = resolveApiBase();
    if (!baseUrl) {
      return NextResponse.json({ deleted: true, search_id: params.searchId });
    }

    const url = new URL(`/reviews/search/saved/${params.searchId}`, baseUrl);
    const headers = await buildHeaders();

    const response = await fetch(url, {
      method: "DELETE",
      headers,
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        typeof payload.detail === "string"
          ? payload.detail
          : "Failed to delete saved search";
      return NextResponse.json(
        { error: errorMessage, details: payload },
        { status: response.status },
      );
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Delete saved search proxy error", error);
    return NextResponse.json(
      { error: "Unable to delete saved search" },
      { status: 500 },
    );
  }
}
