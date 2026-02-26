/**
 * Server-side proxy for the SSI wallet search endpoint.
 *
 * Forwards to core's `GET /investigations/ssi/wallets` via `apiFetch`.
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
    const data = await apiFetch<unknown>("/investigations/ssi/wallets", {
      queryParams,
    });
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[ssi proxy] GET /wallets error:", err);
    return NextResponse.json(
      { error: "Failed to reach wallet service." },
      { status: 502 },
    );
  }
}
