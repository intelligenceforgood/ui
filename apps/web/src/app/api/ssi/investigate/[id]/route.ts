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
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

/** Direct proxy to standalone SSI service (local dev).
 *
 * Queries `/investigations/{id}` on the SSI service (the scan detail
 * endpoint backed by the SQLite scan store) and normalises the response
 * to the shape the client page expects:
 *   `{ investigation_id, status, ssi_investigation_id, result? }`
 */
async function proxyToSsi(id: string): Promise<NextResponse> {
  const baseUrl = resolveSsiUrl();

  let upstream: Response;
  try {
    const headers = await ssiHeaders();
    upstream = await fetch(`${baseUrl}/investigations/${id}`, {
      headers,
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    // SSI service unreachable — return running status so client keeps polling
    return NextResponse.json(
      { investigation_id: id, status: "running", ssi_investigation_id: id },
      { status: 200 },
    );
  }

  if (upstream.status === 404) {
    // Scan not yet written to DB — investigation is still starting
    return NextResponse.json(
      { investigation_id: id, status: "running", ssi_investigation_id: id },
      { status: 200 },
    );
  }

  const data = (await upstream.json()) as Record<string, unknown>;
  const scan = (data.scan ?? {}) as Record<string, unknown>;
  const status = String(scan.status ?? "running");

  // Always surface the scan ID so the UI can open the WebSocket monitor.
  const ssiScanId = String(scan.scan_id ?? id);

  let result: Record<string, unknown> | undefined;
  if (status === "completed" || status === "failed") {
    // SSI's SQLite store persists numeric columns (risk_score, duration_seconds)
    // as TEXT. Parse them to numbers so the UI receives proper JS numbers.
    const parseNum = (v: unknown): number | null => {
      const n = parseFloat(String(v ?? ""));
      return isFinite(n) ? n : null;
    };
    result = {
      status,
      success: status === "completed",
      risk_score: parseNum(scan.risk_score),
      duration_seconds: parseNum(scan.duration_seconds),
      case_id: scan.case_id ?? null,
      ssi_investigation_id: ssiScanId,
      pdf_report_path: status === "completed" ? "generated" : undefined,
      error:
        status === "failed"
          ? scan.error_message ?? "Investigation failed"
          : undefined,
    };
  }

  return NextResponse.json(
    {
      investigation_id: id,
      status,
      ssi_investigation_id: ssiScanId,
      result: result ?? null,
    },
    { status: 200 },
  );
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

  // Log the raw core response for SSI scan ID tracing.
  console.debug(
    "[ssi proxy] task=%s status=%s investigationId=%s scanId=%s",
    taskId,
    status,
    data.investigationId ?? "(absent)",
    data.scanId ?? "(absent)",
  );

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

  // Surface the SSI scan ID at the top level so the client can use it
  // for WebSocket/SSE monitoring even while the investigation is running.
  const ssiScanId = (data.investigationId ?? data.investigation_id ?? null) as
    | string
    | null;

  return NextResponse.json(
    {
      investigation_id: taskId,
      status,
      ssi_investigation_id: ssiScanId,
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
    if (process.env.SSI_API_URL) {
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
