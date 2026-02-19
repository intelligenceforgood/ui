/**
 * Server-side proxy for the SSI `/investigate` endpoint.
 *
 * Keeps `SSI_API_URL` out of the browser bundle and avoids CORS issues.
 */

import { type NextRequest, NextResponse } from "next/server";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const upstream = await fetch(`${SSI_API_URL}/investigate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[ssi proxy] POST /investigate error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
