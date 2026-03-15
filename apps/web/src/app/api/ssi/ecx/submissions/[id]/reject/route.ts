/**
 * Proxy: POST /api/ssi/ecx/submissions/[id]/reject
 *        → SSI POST /ecx/submissions/{id}/reject
 */

import { type NextRequest, NextResponse } from "next/server";
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const body: unknown = await request.json();
  const ssiUrl = resolveSsiUrl();
  try {
    const authHeaders = await ssiHeaders();
    const res = await fetch(`${ssiUrl}/ecx/submissions/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    });
    const data: unknown = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    console.error("[ssi proxy] POST /ecx/submissions/{id}/reject error:", err);
    return NextResponse.json(
      { error: "Failed to reach SSI service." },
      { status: 502 },
    );
  }
}
