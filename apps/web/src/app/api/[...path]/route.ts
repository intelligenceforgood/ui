import { NextRequest, NextResponse } from "next/server";
import { getIapHeaders } from "@/lib/server/auth-helpers";

export const runtime = "nodejs"; // Ensure Node.js runtime for auth libraries

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const pathArray = (await params).path;
  const path = pathArray.join("/");

  // Resolve API URL (runtime env var works here)
  const apiUrl =
    process.env.I4G_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";
  const targetUrl = `${apiUrl}/${path}`;

  // Get Auth Headers (IAP support)
  const headers = await getIapHeaders();

  try {
    const response = await fetch(targetUrl, {
      headers: {
        ...headers,
        // Forward client headers if needed (e.g. Accept)?
        // Be careful with Host header.
      },
    });

    if (!response.ok) {
      console.warn(
        `[Proxy] Failed: ${response.status} ${response.statusText} for /${path}`,
      );
      return new NextResponse(`Proxy Error: ${response.statusText}`, {
        status: response.status,
      });
    }

    // Proxy the response body and headers
    const newHeaders = new Headers(response.headers);
    // Remove headers that might cause issues?
    newHeaders.delete("content-encoding");
    newHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (error) {
    console.error(
      "[Proxy] Error:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

// We can add POST/PUT/DELETE handlers if we want a full proxy,
// but for artifacts GET is sufficient.
// If valid API usage relies on this proxy for other methods, we should add them.
// Given strict instructions, let's add POST/PUT/DELETE to be safe and robust.

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, ctx);
}
export async function PUT(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, ctx);
}
export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, ctx);
}
export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ path: string[] }> },
) {
  return proxyRequest(req, ctx);
}

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const pathArray = (await params).path;
  const path = pathArray.join("/");

  const apiUrl =
    process.env.I4G_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    "http://127.0.0.1:8000";
  const targetUrl = `${apiUrl}/${path}${request.nextUrl.search}`; // Include query params!

  const headers = await getIapHeaders();

  // Forward Content-Type etc
  const clientHeaders = new Headers(request.headers);
  clientHeaders.delete("host");
  clientHeaders.delete("connection");
  // Merge auth headers
  for (const [key, value] of Object.entries(headers)) {
    clientHeaders.set(key, value);
  }

  try {
    const response = await fetch(targetUrl, {
      method: request.method,
      headers: clientHeaders,
      body: request.body, // standard fetch supports streaming body? In Node runtime yes.
      // duplex: 'half' might be needed for some Node versions if body is stream
      // @ts-expect-error Node.js fetch requires 'duplex' for streaming bodies
      duplex: "half",
    });

    const newHeaders = new Headers(response.headers);
    newHeaders.delete("content-encoding");
    newHeaders.delete("content-length");

    return new NextResponse(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  } catch (e) {
    console.error(
      "[Proxy] Error:",
      e instanceof Error ? e.message : "Unknown error",
    );
    return new NextResponse("Internal Proxy Error", { status: 500 });
  }
}
