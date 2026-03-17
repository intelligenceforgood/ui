/**
 * Server-side proxy for SSI investigation submission.
 *
 * **Routing logic:**
 * - When `SSI_API_URL` is set (local dev or direct), proxies to the SSI
 *   service at `POST /trigger/investigate`.
 * - Otherwise (cloud / production), proxies to the core API at
 *   `POST /investigations/ssi` via `apiFetch` which injects IAP auth.
 *   Core forwards the request to the SSI Cloud Run Service (`ssi-svc`).
 *
 * The response is normalised so the client always receives
 * `{ investigation_id, status, message }` regardless of backend.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";
import { resolveSsiUrl, ssiHeaders } from "@/lib/server/ssi-proxy";

export const runtime = "nodejs";

/** Direct proxy to SSI service (local dev or cloud). */
async function proxyToSsi(
  body: Record<string, unknown>,
): Promise<NextResponse> {
  const baseUrl = resolveSsiUrl();
  const headers = await ssiHeaders();
  const upstream = await fetch(`${baseUrl}/trigger/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await upstream.json()) as Record<string, unknown>;
  // SSI returns { scan_id, status, already_investigated, ... }.
  // Normalise to { investigation_id, status } plus dedup fields (camelCase).
  return NextResponse.json(
    {
      investigation_id: data.scan_id,
      status: data.status ?? "accepted",
      ...(data.already_investigated != null && {
        triggered: !data.already_investigated,
        alreadyInvestigated: data.already_investigated,
        existingScanId: data.existing_scan_id,
        existingRiskScore: data.existing_risk_score,
        daysSinceScan: data.days_since_scan,
        reason: data.reason,
      }),
    },
    { status: upstream.status },
  );
}

/**
 * Proxy to core API `POST /investigations/ssi` (cloud).
 *
 * Core returns `{ taskId, status, message, jobName }` (camelCase).
 * We normalise `taskId` → `investigation_id` so the client page
 * can use the same polling path.
 */
async function proxyToCore(
  body: Record<string, unknown>,
): Promise<NextResponse> {
  const corePayload = {
    url: body.url,
    scanType: body.scan_type ?? body.scanType ?? "full",
    pushToCore: body.push_to_core ?? body.pushToCore ?? true,
    triggerDossier: body.trigger_dossier ?? body.triggerDossier ?? false,
    dataset: body.dataset ?? "ssi",
    ...(body.force != null && { force: body.force }),
  };

  const data = await apiFetch<{
    taskId: string;
    status: string;
    message: string;
    jobName?: string;
    triggered?: boolean;
    alreadyInvestigated?: boolean;
    existingScanId?: string;
    existingRiskScore?: number | null;
    daysSinceScan?: number | null;
    reason?: string;
  }>("/investigations/ssi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corePayload),
  });

  return NextResponse.json(
    {
      investigation_id: data.taskId,
      status: data.status,
      message: data.message,
      ...(data.alreadyInvestigated != null && {
        triggered: data.triggered,
        alreadyInvestigated: data.alreadyInvestigated,
        existingScanId: data.existingScanId,
        existingRiskScore: data.existingRiskScore,
        daysSinceScan: data.daysSinceScan,
        reason: data.reason,
      }),
    },
    { status: 202 },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (process.env.SSI_API_URL) {
      return await proxyToSsi(body);
    }
    return await proxyToCore(body);
  } catch (err) {
    console.error("[ssi proxy] POST /investigate error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to reach investigation service.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
