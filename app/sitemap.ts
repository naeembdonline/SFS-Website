import { MetadataRoute } from "next";
import { locales } from "@/lib/i18n/config";
import { getPublishedPostSlugs } from "@/lib/data/public/posts";
import { getPublishedCampaignSlugs } from "@/lib/data/public/campaigns";
import { getPublishedResourceSlugs } from "@/lib/data/public/resources";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

/**
 * Sitemap generator for Next.js.
 * Generates all URLs across all supported locales.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes: MetadataRoute.Sitemap = [];

  // Static routes
  const staticPages = [
    "",
    "/about",
    "/leadership",
    "/news",
    "/blog",
    "/campaigns",
    "/resources",
    "/contact",
    "/privacy",
    "/terms",
  ];

  for (const locale of locales) {
    for (const page of staticPages) {
      routes.push({
        url: `${SITE_URL}/${locale}${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page === "" ? 1 : 0.8,
      });
    }

    // Dynamic: News
    const newsEntries = await getPublishedPostSlugs("news", locale);
    for (const entry of newsEntries) {
      routes.push({
        url: `${SITE_URL}/${locale}/news/${entry.slug}`,
        lastModified: entry.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    // Dynamic: Blog
    const blogEntries = await getPublishedPostSlugs("blog", locale);
    for (const entry of blogEntries) {
      routes.push({
        url: `${SITE_URL}/${locale}/blog/${entry.slug}`,
        lastModified: entry.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }

    // Dynamic: Campaigns
    const campaignEntries = await getPublishedCampaignSlugs(locale);
    for (const entry of campaignEntries) {
      routes.push({
        url: `${SITE_URL}/${locale}/campaigns/${entry.slug}`,
        lastModified: entry.updatedAt,
        changeFrequency: "weekly",
        priority: 0.7,
      });
    }

    // Dynamic: Resources
    const resourceEntries = await getPublishedResourceSlugs(locale);
    for (const entry of resourceEntries) {
      routes.push({
        url: `${SITE_URL}/${locale}/resources/${entry.slug}`,
        lastModified: entry.updatedAt,
        changeFrequency: "monthly",
        priority: 0.6,
      });
    }
  }

  return routes;
}
