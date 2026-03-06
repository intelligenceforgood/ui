/**
 * Proxy: POST /api/ssi/ecx/submissions/[id]/approve
 *        → SSI POST /ecx/submissions/{id}/approve
 */

import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body: unknown = await request.json();
  try {
    const res = await fetch(`${SSI_API_URL}/ecx/submissions/${id}/approve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] POST /ecx/submissions/{id}/approve error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
