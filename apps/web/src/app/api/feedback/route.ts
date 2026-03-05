import { NextResponse } from "next/server";
import { apiFetch, resolveApiBase } from "@/lib/server/api-client";

/**
 * Proxy feedback submissions to the Core API.
 *
 * POST /api/feedback → Core POST /feedback
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const apiBase = resolveApiBase();

    if (!apiBase) {
      // Local-only mode: no backend configured
      // eslint-disable-next-line no-console
      console.log("[feedback] mock submit:", body);
      return NextResponse.json({
        success: true,
        message: "Feedback logged locally (no backend configured).",
      });
    }

    const result = await apiFetch<{ success: boolean; message: string }>(
      "/feedback",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      },
    );

    return NextResponse.json(result);
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error submitting feedback";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
