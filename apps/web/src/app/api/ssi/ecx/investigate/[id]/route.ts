/**
 * Proxy: GET /api/ssi/ecx/investigate/[id] → SSI GET /ecx/investigate/{scan_id}
 *
 * Returns cached eCX enrichment hits for a completed investigation.
 */

import { type NextRequest, NextResponse } from "next/server";
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const ssiUrl = resolveSsiUrl();
  const upstream = `${ssiUrl}/ecx/investigate/${encodeURIComponent(id)}`;
  try {
    const headers = await ssiHeaders();
    const res = await fetch(upstream, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] GET /ecx/investigate error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
