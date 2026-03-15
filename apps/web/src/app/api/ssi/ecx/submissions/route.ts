/**
 * Proxy: GET /api/ssi/ecx/submissions → SSI GET /ecx/submissions
 *
 * Supports query params: scan_id, case_id, status, limit, offset
 */

import { type NextRequest, NextResponse } from "next/server";
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ssiUrl = resolveSsiUrl();
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const upstream = `${ssiUrl}/ecx/submissions${qs ? `?${qs}` : ""}`;
  try {
    const headers = await ssiHeaders();
    const res = await fetch(upstream, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] GET /ecx/submissions error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
