/**
 * Server-side proxy for the SSI `/investigations/{id}` detail endpoint.
 */

import { type NextRequest, NextResponse } from "next/server";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const upstream = await fetch(`${SSI_API_URL}/investigations/${id}`, {
      signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch (err) {
    console.error("[ssi proxy] GET /investigations/:id error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
