import { NextResponse } from "next/server";
import { z } from "zod";
import { getIapToken } from "@/lib/iap-token";
import { resolveApiBase, resolveApiKey } from "@/lib/server/api-client";

const requestSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  params: z.record(z.string(), z.unknown()).default({}),
  favorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  searchId: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid saved search payload",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const baseUrl = resolveApiBase();
    if (!baseUrl) {
      return NextResponse.json(
        { search_id: `mock-saved-${Date.now()}` },
        { status: 201 },
      );
    }

    const url = new URL("/reviews/search/saved", baseUrl);
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };
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

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: parsed.data.name,
        params: parsed.data.params,
        search_id: parsed.data.searchId,
        favorite: parsed.data.favorite,
        tags: parsed.data.tags,
      }),
    });

    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
      const errorMessage =
        typeof payload.detail === "string"
          ? payload.detail
          : "Failed to save search";
      return NextResponse.json(
        { error: errorMessage, details: payload },
        { status: response.status },
      );
    }
    return NextResponse.json(payload, { status: response.status });
  } catch (error) {
    console.error("Save search proxy error", error);
    return NextResponse.json(
      { error: "Unable to save search" },
      { status: 500 },
    );
  }
}
