import { NextResponse } from "next/server";
import { z } from "zod";
import { triggerAccountListRun } from "@/lib/server/account-list-service";

const runRequestSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categories: z.array(z.string()).optional(),
  topK: z.number().int().min(1).max(250).optional(),
  includeSources: z.boolean().optional(),
  outputFormats: z.array(z.string()).optional(),
});

function normaliseDate(value: string | undefined, endOfDay = false) {
  if (!value) {
    return undefined;
  }
  const safe = value.trim();
  if (!safe) {
    return undefined;
  }
  const suffix = endOfDay ? "T23:59:59Z" : "T00:00:00Z";
  const candidate = `${safe}${safe.includes("T") ? "" : suffix}`;
  const date = new Date(candidate);
  if (Number.isNaN(date.getTime())) {
    return undefined;
  }
  return date.toISOString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = runRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid account list request",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const payload = parsed.data;
    const result = await triggerAccountListRun({
      startTime: normaliseDate(payload.startDate),
      endTime: normaliseDate(payload.endDate, true),
      categories: payload.categories,
      topK: payload.topK,
      includeSources: payload.includeSources,
      outputFormats: payload.outputFormats,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error("Account list run API error", error);
    return NextResponse.json({ error: "Unable to start account list run" }, { status: 500 });
  }
}
