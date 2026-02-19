/**
 * Next.js edge middleware — defense-in-depth authentication guard.
 *
 * In **local** environments (`I4G_ENV=local` or localhost API targets)
 * all requests are allowed through without any auth checks.
 *
 * In **dev / prod** (GCP Cloud Run behind IAP) the middleware verifies
 * that the IAP identity header (`X-Goog-Authenticated-User-Email`) is
 * present on every console page request.  API routes are excluded
 * because they handle auth independently via the backend proxy.
 *
 * NOTE: IAP already validates JWT signatures at the load-balancer layer,
 * so this middleware only confirms the header's presence — it does NOT
 * re-validate the JWT.  The purpose is to catch misconfigurations where
 * IAP is accidentally disabled.
 */

import { NextResponse, type NextRequest } from "next/server";

/** Routes that bypass the auth guard entirely. */
const PUBLIC_PREFIXES = ["/api/", "/_next/", "/favicon.ico", "/ssi"];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isLocalEnvironment(): boolean {
  if (process.env.I4G_ENV === "local") return true;

  const apiUrl =
    process.env.I4G_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
  if (
    apiUrl &&
    (apiUrl.includes("localhost") || apiUrl.includes("127.0.0.1"))
  ) {
    return true;
  }

  return false;
}

export function middleware(request: NextRequest) {
  // Local development — bypass all auth checks.
  if (isLocalEnvironment()) {
    return NextResponse.next();
  }

  // Public / framework routes — no guard needed.
  if (isPublicRoute(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // Non-local environments: require IAP identity header.
  const iapEmail = request.headers.get("x-goog-authenticated-user-email");

  if (!iapEmail) {
    return new NextResponse(
      JSON.stringify({
        error: "Unauthorized",
        message:
          "Authentication required. Ensure IAP is enabled for this service.",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Attach identity info as response headers for downstream consumption.
  const response = NextResponse.next();
  response.headers.set("x-i4g-user-email", iapEmail);
  return response;
}

export const config = {
  // Apply middleware to all routes except static assets.
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
