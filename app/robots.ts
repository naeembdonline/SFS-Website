import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/*",
          "/api/",
          "/_next/",
          "/auth/",
          "/login",
          "/health",
          "/*?token=*",
          "/*?session=*",
        ],
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "anthropic-ai", "Claude-Web", "CCBot"],
        disallow: "/",
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
