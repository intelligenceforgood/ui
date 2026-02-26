/**
 * Server-side proxy for SSI PDF report download.
 *
 * Always proxies to core's gateway at
 * `GET /investigations/ssi/{scan_id}/report.pdf` with IAP headers.
 * Core returns a 307 redirect to a GCS signed URL (cloud) or serves
 * the file directly (local dev with shared DB).
 */

import { type NextRequest, NextResponse } from "next/server";

import { resolveApiBase, resolveApiKey } from "@/lib/server/api-client";
import { getIapHeaders } from "@/lib/server/auth-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: scanId } = await params;
  const action = request.nextUrl.searchParams.get("action") ?? "attachment";

  const baseUrl = resolveApiBase();
  if (!baseUrl) {
    return NextResponse.json(
      { error: "API URL not configured" },
      { status: 500 },
    );
  }

  const url = new URL(`/investigations/ssi/${scanId}/report.pdf`, baseUrl);

  const headers: Record<string, string> = {
    Accept: "application/pdf",
    ...(await getIapHeaders()),
  };
  const apiKey = resolveApiKey();
  if (apiKey) {
    headers["X-API-KEY"] = apiKey;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      headers,
      cache: "no-store",
      redirect: "manual",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { error: `Failed to reach API: ${message}` },
      { status: 502 },
    );
  }

  // Core returns 307 with a GCS signed URL — pass through so the
  // browser downloads directly from storage.
  if (response.status === 307) {
    const location = response.headers.get("location");
    if (location) {
      return NextResponse.redirect(location, 307);
    }
  }

  // Forward error responses as JSON.
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    return NextResponse.json(
      { error: body || `Report download failed (${response.status})` },
      { status: response.status },
    );
  }

  return streamPdfResponse(response, scanId, action);
}

// ---------------------------------------------------------------------------
// Stream the upstream PDF back to the browser
// ---------------------------------------------------------------------------

function streamPdfResponse(
  response: Response,
  scanId: string,
  action: string,
): NextResponse {
  const pdfHeaders = new Headers();
  pdfHeaders.set("Content-Type", "application/pdf");

  const filename = `ssi_report_${scanId.slice(0, 8)}.pdf`;
  pdfHeaders.set(
    "Content-Disposition",
    action === "inline"
      ? `inline; filename="${filename}"`
      : `attachment; filename="${filename}"`,
  );

  const contentLength = response.headers.get("content-length");
  if (contentLength) {
    pdfHeaders.set("Content-Length", contentLength);
  }

  return new NextResponse(response.body, {
    status: 200,
    headers: pdfHeaders,
  });
}
