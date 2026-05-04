/**
 * Public data — static pages (home, about, contact, privacy, terms).
 * Import boundary: public routes only.
 */

// import { cacheTag } from "next/cache"; // Disabled for Cloudflare Pages compatibility
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import type { PageSection } from "@/lib/db/schema/content";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageKey = "home" | "about" | "contact" | "privacy" | "terms";

export type PageContent = {
  id: number;
  key: PageKey;
  title: string;
  body: string | null;
  sections: PageSection[] | null;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageId: number | null;
};

// ─── Fetch ────────────────────────────────────────────────────────────────────

export async function getPage(
  key: PageKey,
  locale: Locale
): Promise<PageContent | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`page-${key}`, `page-${key}-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const [row] = await db
      .select({
        id: schema.pages.id,
        key: schema.pages.key,
        title: schema.pageTranslations.title,
        body: schema.pageTranslations.body,
        sections: schema.pageTranslations.sections,
        seoTitle: schema.pageTranslations.seoTitle,
        metaDescription: schema.pageTranslations.metaDescription,
        ogTitle: schema.pageTranslations.ogTitle,
        ogDescription: schema.pageTranslations.ogDescription,
        ogImageId: schema.pageTranslations.ogImageId,
      })
      .from(schema.pages)
      .innerJoin(
        schema.pageTranslations,
        and(
          eq(schema.pageTranslations.pageId, schema.pages.id),
          eq(schema.pageTranslations.locale, locale),
          eq(schema.pageTranslations.status, "published")
        )
      )
      .where(eq(schema.pages.key, key))
      .limit(1);

    if (!row) {
      const { DEMO_PAGES } = await import("@/lib/data/demo");
      return DEMO_PAGES[key]?.[locale] ?? null;
    }

    return {
      id: row.id,
      key: row.key as PageKey,
      title: row.title,
      body: row.body ?? null,
      sections: (row.sections as PageSection[] | null) ?? null,
      seoTitle: row.seoTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      ogTitle: row.ogTitle ?? null,
      ogDescription: row.ogDescription ?? null,
      ogImageId: row.ogImageId ?? null,
    };
  } catch {
    const { DEMO_PAGES } = await import("@/lib/data/demo");
    return DEMO_PAGES[key]?.[locale] ?? null;
  }
}
