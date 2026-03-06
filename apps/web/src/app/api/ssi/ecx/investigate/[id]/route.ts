/**
 * Proxy: GET /api/ssi/ecx/investigate/[id] → SSI GET /ecx/investigate/{scan_id}
 *
 * Returns cached eCX enrichment hits for a completed investigation.
 */

import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } },
): Promise<NextResponse> {
  const { id } = params;
  const upstream = `${SSI_API_URL}/ecx/investigate/${encodeURIComponent(id)}`;
  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(10_000) });
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
