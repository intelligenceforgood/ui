/**
 * Proxy: GET /api/ssi/ecx/feed → SSI GET /ecx/feed
 *
 * Supports query params: module, since_id, confidence_min, brand, limit
 */

import { type NextRequest, NextResponse } from "next/server";
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ssiUrl = resolveSsiUrl();
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const upstream = `${ssiUrl}/ecx/feed${qs ? `?${qs}` : ""}`;
  try {
    const headers = await ssiHeaders();
    const res = await fetch(upstream, {
      headers,
      signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] GET /ecx/feed error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
