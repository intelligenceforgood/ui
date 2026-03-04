/**
 * API proxy for SSI analyst guidance commands — Phase 3C.
 *
 * Proxies `POST /api/events/ssi/{scanId}/guidance` from the browser to
 * core's `POST /events/ssi/{scan_id}/guidance` endpoint.  This allows
 * analysts to send guidance commands (click, type, goto, skip, continue)
 * during live cloud investigations without a direct WebSocket connection
 * to ssi-svc.
 *
 * Authentication follows the same pattern as the SSE stream proxy:
 * service-to-service IAP/OIDC token for Cloud Run.
 */

import { NextRequest, NextResponse } from "next/server";
import { getIapHeaders } from "@/lib/server/auth-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ scanId: string }> },
) {
  const { scanId } = await params;

  const apiUrl =
    process.env.I4G_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const headers = await getIapHeaders();

    const res = await fetch(`${apiUrl}/events/ssi/${scanId}/guidance`, {
      method: "POST",
      headers: {
        ...headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await res.json().catch(() => null);

    return NextResponse.json(data ?? { status: "proxied" }, {
      status: res.status,
    });
  } catch (err) {
    console.error(
      "[Guidance Proxy] Error for scan",
      scanId,
      err instanceof Error ? err.message : err,
    );
    return NextResponse.json(
      { error: "Failed to proxy guidance command" },
      { status: 502 },
    );
  }
}
