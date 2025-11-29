import { NextResponse } from "next/server";
import { getAccountListRuns } from "@/lib/server/account-list-service";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;
    const runs = await getAccountListRuns(limit ?? 10);
    return NextResponse.json({ runs, count: runs.length });
  } catch (error) {
    console.error("Account list runs API error", error);
    return NextResponse.json(
      { error: "Unable to load account list runs" },
      { status: 500 },
    );
  }
}
