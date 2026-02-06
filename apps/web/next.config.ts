import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
