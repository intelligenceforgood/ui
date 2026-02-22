/**
 * Server-side proxy for the SSI `/wallets` search endpoint.
 */

import { type NextRequest, NextResponse } from "next/server";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = request.nextUrl;
  const qs = searchParams.toString();
  const url = `${SSI_API_URL}/wallets${qs ? `?${qs}` : ""}`;

  try {
    const upstream = await fetch(url, {
      signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[ssi proxy] GET /wallets error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
