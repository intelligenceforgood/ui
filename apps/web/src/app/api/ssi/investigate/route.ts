/**
 * Server-side proxy for SSI investigation submission.
 *
 * **Routing logic (local dev only):**
 * - When `SSI_API_URL` is set, proxies directly to the standalone SSI
 *   service at `POST /investigate`. This is needed in local dev because
 *   core's subprocess trigger can't update the in-memory task status.
 * - Otherwise (cloud / production), proxies to the core API at
 *   `POST /investigations/ssi` via `apiFetch` which injects IAP auth.
 *   Core triggers an SSI Cloud Run Job; SSI-API is not deployed in cloud.
 *
 * The response is normalised so the client always receives
 * `{ investigation_id, status, message }` regardless of backend.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";

export const runtime = "nodejs";

/** SSI service URL — set only in local dev. */
const SSI_API_URL = process.env.SSI_API_URL;

/** Direct proxy to standalone SSI service (local dev). */
async function proxyToSsi(
  body: Record<string, unknown>,
): Promise<NextResponse> {
  const baseUrl = SSI_API_URL ?? "http://localhost:8100";
  const upstream = await fetch(`${baseUrl}/investigate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(15_000),
  });
  const data: unknown = await upstream.json();
  return NextResponse.json(data, { status: upstream.status });
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
  };

  const data = await apiFetch<{
    taskId: string;
    status: string;
    message: string;
    jobName?: string;
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
    },
    { status: 202 },
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;

    if (SSI_API_URL) {
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
