import { NextResponse } from "next/server";
import { z } from "zod";

import { getI4GClient } from "@/lib/i4g-client";

const verifyRequestSchema = z.object({
  planId: z.string().min(1, "planId is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = verifyRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid verification request",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const client = getI4GClient();
    const report = await client.verifyDossier(parsed.data.planId);

    return NextResponse.json(report);
  } catch (error) {
    console.error("Dossier verification API error", error);
    return NextResponse.json(
      { error: "Unable to verify dossier signatures" },
      { status: 500 },
    );
  }
}
