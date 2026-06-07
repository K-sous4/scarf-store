import type { NextConfig } from "next";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:8000";

const nextConfig: NextConfig = {
  output: "standalone",
  // Evita 308 /api/.../ → /api/... no domínio da Vercel
  skipTrailingSlashRedirect: true,
  // Fallback local (Docker): produção usa app/api/v1/[...path]/route.ts
  async rewrites() {
    if (process.env.VERCEL) return []
    return [
      {
        source: "/api/v1/:path*",
        destination: `${BACKEND_URL}/api/v1/:path*`,
      },
    ];
  },
};

export default nextConfig;
