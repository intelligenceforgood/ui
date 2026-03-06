/**
 * Proxy: GET /api/ssi/ecx/polling-status → SSI GET /ecx/polling-status
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function GET(): Promise<NextResponse> {
  const upstream = `${SSI_API_URL}/ecx/polling-status`;
  try {
    const res = await fetch(upstream, { signal: AbortSignal.timeout(10_000) });
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
