import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: parent folder also has package-lock.json — trace files from this app only
  outputFileTracingRoot: path.join(__dirname),

  /** If Vercel still has legacy Vite names, map them so the client bundle gets public Supabase config. */
  env: {
    NEXT_PUBLIC_SUPABASE_URL:
      process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "",
    NEXT_PUBLIC_PLATFORM_BASE_DOMAIN: process.env.NEXT_PUBLIC_PLATFORM_BASE_DOMAIN ?? "",
    NEXT_PUBLIC_AUTH_COOKIE_DOMAIN: process.env.NEXT_PUBLIC_AUTH_COOKIE_DOMAIN ?? "",
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },

  async redirects() {
    return [{ source: "/create-tenant", destination: "/create-account", permanent: true }];
  },

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
  eslint: {
    // Vite project predates Next’s default @typescript-eslint strictness; tighten rules incrementally.
    ignoreDuringBuilds: false,
  },
  typescript: {
    // Supabase typed client + copied Vite code: fix `never` / `any` mismatches incrementally.
    ignoreBuildErrors: false,
  },
};

export default nextConfig;

