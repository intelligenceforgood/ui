/**
 * Proxy: GET /api/ssi/ecx/stats/phish-by-brand → SSI GET /ecx/stats/phish-by-brand
 */

import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const upstream = `${SSI_API_URL}/ecx/stats/phish-by-brand${qs ? `?${qs}` : ""}`;
  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(15_000) });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] GET /ecx/stats/phish-by-brand error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
