/**
 * Public data — campaigns.
 * Import boundary: public routes only.
 */

// import { cacheTag } from "next/cache"; // Disabled for Cloudflare Pages compatibility
import { eq, and, isNull, desc, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CampaignListItem = {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  coverMediaId: number | null;
  statusLifecycle: "active" | "past";
  startDate: string | null;
  endDate: string | null;
};

export type PublishedCampaignSlug = {
  slug: string;
  updatedAt: Date;
};

export type CampaignDetail = CampaignListItem & {
  body: string;
  goals: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageId: number | null;
  availableLocales: Locale[];
};

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getCampaignList(
  locale: Locale,
  limit = 20,
  offset = 0
): Promise<CampaignListItem[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`campaigns`, `campaigns-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        id: schema.campaigns.id,
        slug: schema.campaignTranslations.slug,
        title: schema.campaignTranslations.title,
        excerpt: schema.campaignTranslations.excerpt,
        publishedAt: schema.campaignTranslations.publishedAt,
        coverMediaId: schema.campaigns.coverMediaId,
        statusLifecycle: schema.campaigns.statusLifecycle,
        startDate: schema.campaigns.startDate,
        endDate: schema.campaigns.endDate,
      })
      .from(schema.campaigns)
      .innerJoin(
        schema.campaignTranslations,
        and(
          eq(schema.campaignTranslations.campaignId, schema.campaigns.id),
          eq(schema.campaignTranslations.locale, locale),
          eq(schema.campaignTranslations.status, "published")
        )
      )
      .where(isNull(schema.campaigns.deletedAt))
      .orderBy(desc(schema.campaignTranslations.publishedAt))
      .limit(limit)
      .offset(offset);

    return rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt ?? null,
      publishedAt: r.publishedAt ?? null,
      coverMediaId: r.coverMediaId ?? null,
      statusLifecycle: r.statusLifecycle as "active" | "past",
      startDate: r.startDate ?? null,
      endDate: r.endDate ?? null,
    }));
  } catch {
    return [];
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getCampaignBySlug(
  slug: string,
  locale: Locale
): Promise<CampaignDetail | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`campaigns`, `campaigns-${locale}`, `campaign-slug-${locale}-${slug}`); // Disabled for Cloudflare Pages compatibility

  try {
    const [row] = await db
      .select({
        id: schema.campaigns.id,
        slug: schema.campaignTranslations.slug,
        title: schema.campaignTranslations.title,
        excerpt: schema.campaignTranslations.excerpt,
        body: schema.campaignTranslations.body,
        goals: schema.campaignTranslations.goals,
        publishedAt: schema.campaignTranslations.publishedAt,
        coverMediaId: schema.campaigns.coverMediaId,
        statusLifecycle: schema.campaigns.statusLifecycle,
        startDate: schema.campaigns.startDate,
        endDate: schema.campaigns.endDate,
        seoTitle: schema.campaignTranslations.seoTitle,
        metaDescription: schema.campaignTranslations.metaDescription,
        ogTitle: schema.campaignTranslations.ogTitle,
        ogDescription: schema.campaignTranslations.ogDescription,
        ogImageId: schema.campaignTranslations.ogImageId,
      })
      .from(schema.campaigns)
      .innerJoin(
        schema.campaignTranslations,
        and(
          eq(schema.campaignTranslations.campaignId, schema.campaigns.id),
          eq(schema.campaignTranslations.locale, locale),
          eq(schema.campaignTranslations.slug, slug),
          eq(schema.campaignTranslations.status, "published")
        )
      )
      .where(isNull(schema.campaigns.deletedAt))
      .limit(1);

    if (!row) return null;

    const siblings = await db
      .select({ locale: schema.campaignTranslations.locale })
      .from(schema.campaignTranslations)
      .where(
        and(
          eq(schema.campaignTranslations.campaignId, row.id),
          eq(schema.campaignTranslations.status, "published"),
          ne(schema.campaignTranslations.locale, locale)
        )
      );

    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? null,
      body: row.body,
      goals: row.goals ?? null,
      publishedAt: row.publishedAt ?? null,
      coverMediaId: row.coverMediaId ?? null,
      statusLifecycle: row.statusLifecycle as "active" | "past",
      startDate: row.startDate ?? null,
      endDate: row.endDate ?? null,
      seoTitle: row.seoTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      ogTitle: row.ogTitle ?? null,
      ogDescription: row.ogDescription ?? null,
      ogImageId: row.ogImageId ?? null,
      availableLocales: siblings.map((s) => s.locale as Locale),
    };
  } catch {
    return null;
  }
}

// ─── Fallback — find all published locale+slug pairs for a slug in any locale ─

export async function getCampaignLocalesBySlug(
  slug: string
): Promise<{ locale: Locale; slug: string }[] | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`campaigns`); // Disabled for Cloudflare Pages compatibility

  try {
    const [found] = await db
      .select({ campaignId: schema.campaignTranslations.campaignId })
      .from(schema.campaignTranslations)
      .innerJoin(
        schema.campaigns,
        and(
          eq(schema.campaigns.id, schema.campaignTranslations.campaignId),
          isNull(schema.campaigns.deletedAt)
        )
      )
      .where(
        and(
          eq(schema.campaignTranslations.slug, slug),
          eq(schema.campaignTranslations.status, "published")
        )
      )
      .limit(1);

    if (!found) return null;

    const rows = await db
      .select({
        locale: schema.campaignTranslations.locale,
        slug: schema.campaignTranslations.slug,
      })
      .from(schema.campaignTranslations)
      .where(
        and(
          eq(schema.campaignTranslations.campaignId, found.campaignId),
          eq(schema.campaignTranslations.status, "published")
        )
      );

    return rows.length > 0
      ? rows.map((r) => ({ locale: r.locale as Locale, slug: r.slug }))
      : null;
  } catch {
    return null;
  }
}

// ─── Slug list for generateStaticParams ──────────────────────────────────────

export async function getPublishedCampaignSlugs(
  locale: Locale
): Promise<PublishedCampaignSlug[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`campaigns`, `campaigns-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        slug: schema.campaignTranslations.slug,
        updatedAt: schema.campaignTranslations.updatedAt,
      })
      .from(schema.campaignTranslations)
      .innerJoin(
        schema.campaigns,
        and(
          eq(schema.campaigns.id, schema.campaignTranslations.campaignId),
          isNull(schema.campaigns.deletedAt)
        )
      )
      .where(
        and(
          eq(schema.campaignTranslations.locale, locale),
          eq(schema.campaignTranslations.status, "published")
        )
      );

    return rows;
  } catch {
    return [];
  }
}
