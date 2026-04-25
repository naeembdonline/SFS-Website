import type { NextConfig } from "next";

// Security headers (CSP, HSTS, etc.) are intentionally NOT set here.
// They will be applied in Phase 23 (Security Hardening) via proxy.ts
// using nonces — the correct production approach that avoids 'unsafe-eval'.
// Setting them here breaks Next.js in all environments because webpack's
// module runtime requires eval().

const nextConfig: NextConfig = {  
  trailingSlash: true,
  // typedRoutes enabled once all routes are established
  // typedRoutes: true,
  // Next.js 16 Cache Components — enables 'use cache' directive, cacheTag, cacheLife
  cacheComponents: false,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default nextConfig;
