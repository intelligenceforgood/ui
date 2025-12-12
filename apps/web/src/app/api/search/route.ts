import { NextResponse } from "next/server";
import { getI4GClient } from "@/lib/i4g-client";
import { searchRequestSchema } from "@i4g/sdk";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = searchRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Invalid search request",
          issues: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const client = getI4GClient();
    const results = await client.searchIntelligence(parsed.data);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Search API error", error);
    return NextResponse.json(
      { error: "Unable to process search" },
      { status: 500 },
    );
  }
}
