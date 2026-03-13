import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["google-auth-library"],
  async redirects() {
    return [
      {
        source: "/accounts",
        destination: "/intelligence/indicators",
        permanent: true,
      },
      {
        source: "/analytics",
        destination: "/impact",
        permanent: true,
      },
      {
        source: "/taxonomy",
        destination: "/impact/taxonomy",
        permanent: true,
      },
      {
        source: "/campaigns",
        destination: "/intelligence/campaigns",
        permanent: true,
      },
    ];
  },
  async rewrites() {
    return [
      // Rewrite artifacts request to the internal catch-all API route to handle proxying + Auth
      {
        source: "/artifacts/:path*",
        destination: "/api/artifacts/:path*",
      },
      // Note: Requests to /api/* that do not match a specific file route
      // will automatically fall through to the /api/[...path] catch-all route.
    ];
  },
};

export default nextConfig;
