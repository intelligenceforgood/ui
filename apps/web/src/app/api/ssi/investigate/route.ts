/**
 * Server-side proxy for SSI investigation submission.
 *
 * Always proxies to Core API at `POST /investigations/ssi` via `apiFetch`
 * (which injects IAP auth in cloud). Core is the orchestrator — it creates
 * the task record, performs dedup checks, and forwards to the SSI Cloud Run
 * Service. This ensures both manual (UI) and automated (case-intake)
 * investigation triggers share a single code path.
 *
 * The response is normalised so the client always receives
 * `{ investigation_id, status, message }`.
 */

import { type NextRequest, NextResponse } from "next/server";
import { apiFetch } from "@/lib/server/api-client";

export const runtime = "nodejs";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = (await request.json()) as Record<string, unknown>;

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
  } catch (err) {
    console.error("[ssi proxy] POST /investigate error:", err);
    const message =
      err instanceof Error
        ? err.message
        : "Failed to reach investigation service.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
