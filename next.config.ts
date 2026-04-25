import type { NextConfig } from "next";

const nextConfig: NextConfig = {  
  trailingSlash: true,
  // Next.js 16 Cache Components — enables 'use cache' directive
  experimental: {
    dynamicIO: true,
  },
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
