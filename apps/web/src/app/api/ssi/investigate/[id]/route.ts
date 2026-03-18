/**
 * Server-side proxy for SSI investigation status polling.
 *
 * Always polls Core's task-status API at `GET /tasks/{id}` via `apiFetch`
 * (with IAP auth in cloud) and normalises the response to the
 * `StatusResponse` shape the client expects.
 *
 * Core is the single source of truth for task status. The SSI service
 * pushes status updates back to Core via `TaskStatusReporter`, so
 * Core's `/tasks/{id}` endpoint reflects the latest state regardless
 * of environment.
 *
 * Core's task dict (populated by SSI's `TaskStatusReporter`) includes
 * extra fields like `case_id`, `investigation_id`, and `risk_score`
 * when the investigation completes — these are forwarded through.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const data = await apiFetch<Record<string, unknown>>(`/tasks/${id}`);

    const status = String(data.status ?? "unknown");

    console.debug(
      "[ssi proxy] task=%s status=%s investigationId=%s",
      id,
      status,
      data.investigationId ?? "(absent)",
    );

    let result: Record<string, unknown> | undefined;
    if (status === "completed" || status === "failed") {
      result = {
        status,
        success: status === "completed",
        risk_score: data.riskScore ?? data.risk_score,
        duration_seconds: data.durationSeconds ?? data.duration_seconds,
        case_id: data.caseId ?? data.case_id,
        ssi_investigation_id: data.investigationId ?? data.investigation_id,
        pdf_report_path: status === "completed" ? "pending" : undefined,
        error: status === "failed" ? data.message : undefined,
      };
    }

    const ssiScanId = (data.investigationId ??
      data.investigation_id ??
      null) as string | null;

    return NextResponse.json(
      {
        investigation_id: id,
        status,
        ssi_investigation_id: ssiScanId,
        result: result ?? null,
      },
      { status: 200 },
    );
  } catch (err) {
    console.error("[ssi proxy] GET /investigate/:id error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to reach investigation service.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
