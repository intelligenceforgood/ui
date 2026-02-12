import { NextResponse } from "next/server";
import { getIapToken } from "@/lib/iap-token";
import { resolveApiBase, resolveApiKey } from "@/lib/server/api-client";

export async function POST(request: Request) {
  try {
    const incomingForm = await request.formData();
    const payload = incomingForm.get("payload");

    if (typeof payload !== "string" || !payload.trim()) {
      return NextResponse.json({ error: "Missing payload" }, { status: 400 });
    }

    const apiBase = resolveApiBase();
    const apiKey = resolveApiKey();

    if (!apiBase) {
      return NextResponse.json(
        {
          intake_id: `mock-intake-${Date.now()}`,
          job_id: null,
          attachments: [],
          status: "received",
          job: null,
          mocked: true,
        },
        { status: 201 },
      );
    }

    const outboundForm = new FormData();
    outboundForm.set("payload", payload);

    const files = incomingForm.getAll("files");
    files.forEach((file, index) => {
      if (file instanceof File) {
        outboundForm.append(
          "files",
          file,
          file.name || `attachment-${index + 1}`,
        );
      }
    });

    const iapClientId = process.env.I4G_IAP_CLIENT_ID;
    const iapToken = iapClientId ? await getIapToken(iapClientId) : null;
    const headers: Record<string, string> = {};
    if (apiKey) headers["X-API-KEY"] = apiKey;
    if (iapToken) headers["Authorization"] = `Bearer ${iapToken}`;

    const response = await fetch(new URL("/intakes/", apiBase), {
      method: "POST",
      headers,
      body: outboundForm,
    });

    if (!response.ok) {
      const errorPayload = await response
        .json()
        .catch(() => ({ message: "Unknown error" }));
      return NextResponse.json(
        {
          error: "Intake submission failed",
          details: errorPayload,
        },
        { status: response.status },
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error("Intake API proxy error", error);
    return NextResponse.json(
      { error: "Unable to submit intake" },
      { status: 500 },
    );
  }
}
