/**
 * Server-side proxy for the SSI investigation detail endpoint.
 *
 * Forwards to core's `GET /investigations/ssi/{id}` via `apiFetch`.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const data = await apiFetch<unknown>(`/investigations/ssi/${id}`);
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[ssi proxy] GET /investigations/:id error:", err);
    const status = String(err).includes("404") ? 404 : 502;
    return NextResponse.json(
      { error: "Failed to load investigation." },
      { status },
    );
  }
}
