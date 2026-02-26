/**
 * Server-side proxy for SSI investigation status polling.
 *
 * **Routing logic (local dev only):**
 * - When `SSI_API_URL` is set, polls the standalone SSI service at
 *   `GET /investigate/{id}`. Needed because core's in-memory task
 *   status can't be updated by the SSI subprocess in local dev.
 * - Otherwise (cloud / production), polls core's task-status API at
 *   `GET /tasks/{id}` via `apiFetch` (with IAP auth) and normalises
 *   the response to the `StatusResponse` shape the client expects.
 *
 * Core's task dict (populated by SSI's `TaskStatusReporter`) includes
 * extra fields like `case_id`, `investigation_id`, and `risk_score`
 * when the investigation completes — these are forwarded through.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";

export const runtime = "nodejs";

/** SSI service URL — set only in local dev. */
const SSI_API_URL = process.env.SSI_API_URL;

/** Direct proxy to standalone SSI service (local dev). */
async function proxyToSsi(id: string): Promise<NextResponse> {
  const baseUrl = SSI_API_URL ?? "http://localhost:8100";
  const upstream = await fetch(`${baseUrl}/investigate/${id}`, {
    signal: AbortSignal.timeout(10_000),
  });
  const data = (await upstream.json()) as Record<string, unknown>;

  // Normalise: SSI returns the scan ID as `result.investigation_id`.
  // Map it to `result.ssi_investigation_id` so the client page always
  // finds the scan ID under the same key regardless of backend path.
  if (data.result && typeof data.result === "object") {
    const result = data.result as Record<string, unknown>;
    if (result.investigation_id && !result.ssi_investigation_id) {
      result.ssi_investigation_id = result.investigation_id;
    }
  }

  return NextResponse.json(data, { status: upstream.status });
}

/**
 * Poll core's `GET /tasks/{id}` and normalise to the SSI status shape.
 *
 * Core returns:
 *   `{ taskId, status, message, investigationId?, caseId?, riskScore?, durationSeconds? }`
 *
 * The client page expects:
 *   `{ investigation_id, status, result? }`
 */
async function proxyToCore(taskId: string): Promise<NextResponse> {
  const data = await apiFetch<Record<string, unknown>>(`/tasks/${taskId}`);

  const status = String(data.status ?? "unknown");

  // Build a result object for completed/failed investigations
  // using the extra fields the TaskStatusReporter pushes.
  let result: Record<string, unknown> | undefined;
  if (status === "completed" || status === "failed") {
    result = {
      status,
      success: status === "completed",
      risk_score: data.riskScore ?? data.risk_score,
      duration_seconds: data.durationSeconds ?? data.duration_seconds,
      case_id: data.caseId ?? data.case_id,
      // investigation_id is the SSI scan ID (distinct from task_id)
      ssi_investigation_id: data.investigationId ?? data.investigation_id,
      // Always indicate a PDF exists for completed investigations so the
      // page can render report download links (the report is served by
      // core's /investigations/ssi/{scan_id}/report.pdf endpoint).
      pdf_report_path: status === "completed" ? "generated" : undefined,
      error: status === "failed" ? data.message : undefined,
    };
  }

  return NextResponse.json(
    {
      investigation_id: taskId,
      status,
      result: result ?? null,
    },
    { status: 200 },
  );
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    if (SSI_API_URL) {
      return await proxyToSsi(id);
    }
    return await proxyToCore(id);
  } catch (err) {
    console.error("[ssi proxy] GET /investigate/:id error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to reach investigation service.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
