/**
 * Proxy: GET /api/ssi/ecx/polling-status → SSI GET /ecx/polling-status
 */

import { NextResponse } from "next/server";
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

export async function GET(): Promise<NextResponse> {
  const ssiUrl = resolveSsiUrl();
  const upstream = `${ssiUrl}/ecx/polling-status`;
  try {
    const headers = await ssiHeaders();
    const res = await fetch(upstream, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] GET /ecx/polling-status error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
