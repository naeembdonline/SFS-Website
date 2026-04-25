import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  trailingSlash: true,
  // Note: cacheComponents and dynamicIO removed for Cloudflare Pages compatibility
  // Next.js default fetch caching will be used instead
  cacheComponents: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" }
        ],
      },
    ];
  }
};

export default nextConfig;
