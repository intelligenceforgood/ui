import { NextResponse } from "next/server";
import { getSearchHistory } from "@/lib/server/reviews-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = Math.min(Math.max(Number(limitParam ?? 10) || 10, 1), 200);
    const events = await getSearchHistory(limit);
    return NextResponse.json({ events }, { status: 200 });
  } catch (error) {
    console.error("History proxy error", error);
    return NextResponse.json({ error: "Unable to load history" }, { status: 500 });
  }
}
