import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

function isWithinBase(baseDir: string, candidate: string) {
  const normalizedBase = path.resolve(baseDir);
  const normalizedCandidate = path.resolve(candidate);
  const relative = path.relative(normalizedBase, normalizedCandidate);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const rawPath = url.searchParams.get("path");

  if (!rawPath) {
    return NextResponse.json(
      { error: "Missing path query parameter" },
      { status: 400 },
    );
  }

  const baseDir = process.env.I4G_DOSSIER_BASE_PATH ?? process.env.I4G_DATA_DIR;
  if (!baseDir) {
    return NextResponse.json(
      { error: "Local dossier downloads disabled: set I4G_DOSSIER_BASE_PATH" },
      { status: 503 },
    );
  }

  const resolvedPath = path.resolve(rawPath);
  if (!isWithinBase(baseDir, resolvedPath)) {
    return NextResponse.json(
      { error: "Requested path outside allowed base" },
      { status: 400 },
    );
  }

  try {
    const data = await fs.readFile(resolvedPath);
    const filename = path.basename(resolvedPath) || "download";
    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error("Dossier download error", error);
    return NextResponse.json(
      { error: "Unable to read dossier artifact" },
      { status: 404 },
    );
  }
}
