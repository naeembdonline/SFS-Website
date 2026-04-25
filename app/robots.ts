import { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/**
 * Robots.txt generator.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/api",
        "/_next",
        "/static",
        "/public",
        "/auth",
        "/login",
        "/health",
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
