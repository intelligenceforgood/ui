/**
 * Server-side proxy for the SSI `/report/{id}/pdf` download endpoint.
 *
 * Streams the binary PDF response back to the browser so the client
 * never needs a direct connection to the SSI service.
 */

import { type NextRequest, NextResponse } from "next/server";

const SSI_API_URL = process.env.SSI_API_URL ?? "http://localhost:8100";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  const action = request.nextUrl.searchParams.get("action") ?? "attachment";
  try {
    const upstream = await fetch(`${SSI_API_URL}/report/${id}/pdf`, {
      signal: AbortSignal.timeout(30_000),
    });

    if (!upstream.ok) {
      return NextResponse.json(
        { error: "Report not ready or not found." },
        { status: upstream.status },
      );
    }

    const pdfBuffer = await upstream.arrayBuffer();
    const disposition =
      action === "inline"
        ? "inline"
        : `attachment; filename="ssi_report_${id.slice(0, 8)}.pdf"`;
    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": disposition,
      },
    });
  } catch (err) {
    console.error("[ssi proxy] GET /report/:id/pdf error:", err);
    return NextResponse.json(
      { error: "Failed to retrieve PDF from SSI service." },
      { status: 502 },
    );
  }
}
