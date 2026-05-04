/**
 * Public data — resources (PDF, link, doc).
 * Import boundary: public routes only.
 */

// import { cacheTag } from "next/cache"; // Disabled for Cloudflare Pages compatibility
import { eq, and, isNull, desc, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type ResourceKind = "pdf" | "link" | "doc";

export type PublishedResourceSlug = {
  slug: string;
  updatedAt: Date;
};

export type ResourceListItem = {
  id: number;
  kind: ResourceKind;
  slug: string;
  title: string;
  description: string | null;
  publishedAt: Date | null;
  fileMediaId: number | null;
  externalUrl: string | null;
};

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getResourceList(
  locale: Locale,
  limit = 30,
  offset = 0
): Promise<ResourceListItem[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`resources`, `resources-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        id: schema.resources.id,
        kind: schema.resources.kind,
        slug: schema.resourceTranslations.slug,
        title: schema.resourceTranslations.title,
        description: schema.resourceTranslations.description,
        publishedAt: schema.resourceTranslations.publishedAt,
        fileMediaId: schema.resources.fileMediaId,
        externalUrl: schema.resources.externalUrl,
      })
      .from(schema.resources)
      .innerJoin(
        schema.resourceTranslations,
        and(
          eq(schema.resourceTranslations.resourceId, schema.resources.id),
          eq(schema.resourceTranslations.locale, locale),
          eq(schema.resourceTranslations.status, "published")
        )
      )
      .where(isNull(schema.resources.deletedAt))
      .orderBy(desc(schema.resourceTranslations.publishedAt))
      .limit(limit)
      .offset(offset);

    const result = rows.map((r) => ({
      id: r.id,
      kind: r.kind as ResourceKind,
      slug: r.slug,
      title: r.title,
      description: r.description ?? null,
      publishedAt: r.publishedAt ?? null,
      fileMediaId: r.fileMediaId ?? null,
      externalUrl: r.externalUrl ?? null,
    }));

    if (result.length === 0) {
      const { DEMO_RESOURCES } = await import("@/lib/data/demo");
      return DEMO_RESOURCES[locale] ?? DEMO_RESOURCES.en;
    }

    return result;
  } catch {
    const { DEMO_RESOURCES } = await import("@/lib/data/demo");
    return DEMO_RESOURCES[locale] ?? DEMO_RESOURCES.en;
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export type ResourceDetail = ResourceListItem & {
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageId: number | null;
  availableLocales: Locale[];
};

export async function getResourceBySlug(
  slug: string,
  locale: Locale
): Promise<ResourceDetail | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`resources`, `resources-${locale}`, `resource-slug-${locale}-${slug}`); // Disabled for Cloudflare Pages compatibility

  try {
    const [row] = await db
      .select({
        id: schema.resources.id,
        kind: schema.resources.kind,
        slug: schema.resourceTranslations.slug,
        title: schema.resourceTranslations.title,
        description: schema.resourceTranslations.description,
        publishedAt: schema.resourceTranslations.publishedAt,
        fileMediaId: schema.resources.fileMediaId,
        externalUrl: schema.resources.externalUrl,
        seoTitle: schema.resourceTranslations.seoTitle,
        metaDescription: schema.resourceTranslations.metaDescription,
        ogTitle: schema.resourceTranslations.ogTitle,
        ogDescription: schema.resourceTranslations.ogDescription,
        ogImageId: schema.resourceTranslations.ogImageId,
      })
      .from(schema.resources)
      .innerJoin(
        schema.resourceTranslations,
        and(
          eq(schema.resourceTranslations.resourceId, schema.resources.id),
          eq(schema.resourceTranslations.locale, locale),
          eq(schema.resourceTranslations.slug, slug),
          eq(schema.resourceTranslations.status, "published")
        )
      )
      .where(isNull(schema.resources.deletedAt))
      .limit(1);

    if (!row) return null;

    const siblings = await db
      .select({ locale: schema.resourceTranslations.locale })
      .from(schema.resourceTranslations)
      .where(
        and(
          eq(schema.resourceTranslations.resourceId, row.id),
          eq(schema.resourceTranslations.status, "published"),
          ne(schema.resourceTranslations.locale, locale)
        )
      );

    return {
      id: row.id,
      kind: row.kind as ResourceKind,
      slug: row.slug,
      title: row.title,
      description: row.description ?? null,
      publishedAt: row.publishedAt ?? null,
      fileMediaId: row.fileMediaId ?? null,
      externalUrl: row.externalUrl ?? null,
      seoTitle: row.seoTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      ogTitle: row.ogTitle ?? null,
      ogDescription: row.ogDescription ?? null,
      ogImageId: row.ogImageId ?? null,
      availableLocales: siblings.map((s) => s.locale as Locale),
    };
  } catch {
    // DB unavailable — synthesise from demo list data
    const { DEMO_RESOURCES } = await import("@/lib/data/demo");
    const list = DEMO_RESOURCES[locale] ?? DEMO_RESOURCES.en ?? [];
    const found = list.find((r) => r.slug === slug);
    if (found) {
      return {
        ...found,
        seoTitle: null,
        metaDescription: found.description ?? null,
        ogTitle: null,
        ogDescription: null,
        ogImageId: null,
        availableLocales: [],
      };
    }
    return null;
  }
}

// ─── Fallback — find all published locale+slug pairs for a slug in any locale ─

export async function getResourceLocalesBySlug(
  slug: string
): Promise<{ locale: Locale; slug: string }[] | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`resources`); // Disabled for Cloudflare Pages compatibility

  try {
    const [found] = await db
      .select({ resourceId: schema.resourceTranslations.resourceId })
      .from(schema.resourceTranslations)
      .innerJoin(
        schema.resources,
        and(
          eq(schema.resources.id, schema.resourceTranslations.resourceId),
          isNull(schema.resources.deletedAt)
        )
      )
      .where(
        and(
          eq(schema.resourceTranslations.slug, slug),
          eq(schema.resourceTranslations.status, "published")
        )
      )
      .limit(1);

    if (!found) return null;

    const rows = await db
      .select({
        locale: schema.resourceTranslations.locale,
        slug: schema.resourceTranslations.slug,
      })
      .from(schema.resourceTranslations)
      .where(
        and(
          eq(schema.resourceTranslations.resourceId, found.resourceId),
          eq(schema.resourceTranslations.status, "published")
        )
      );

    return rows.length > 0
      ? rows.map((r) => ({ locale: r.locale as Locale, slug: r.slug }))
      : null;
  } catch {
    return null;
  }
}

// ─── Slug list for sitemap ───────────────────────────────────────────────────

export async function getPublishedResourceSlugs(
  locale: Locale
): Promise<PublishedResourceSlug[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`list:resources:${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        slug: schema.resourceTranslations.slug,
        updatedAt: schema.resourceTranslations.updatedAt,
      })
      .from(schema.resourceTranslations)
      .innerJoin(
        schema.resources,
        and(
          eq(schema.resources.id, schema.resourceTranslations.resourceId),
          isNull(schema.resources.deletedAt)
        )
      )
      .where(
        and(
          eq(schema.resourceTranslations.locale, locale),
          eq(schema.resourceTranslations.status, "published")
        )
      );

    return rows;
  } catch {
    return [];
  }
}
