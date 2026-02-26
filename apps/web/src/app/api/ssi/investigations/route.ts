/**
 * Server-side proxy for the SSI investigation list endpoint.
 *
 * Forwards to core's `GET /investigations/ssi/history` via `apiFetch`.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const queryParams: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    queryParams[key] = value;
  }

  try {
    const data = await apiFetch<unknown>("/investigations/ssi/history", {
      queryParams,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[ssi proxy] GET /investigations error:", err);
    return NextResponse.json(
      { error: "Failed to reach investigation service." },
      { status: 502 },
    );
  }
}
