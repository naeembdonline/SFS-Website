import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

export type CampaignLifecycle = "active" | "past";

export interface AdminCampaignTranslation {
  id: number | null;
  locale: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  goals: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date | null;
}

export interface AdminCampaignDetail {
  id: number;
  statusLifecycle: CampaignLifecycle;
  startDate: string | null;
  endDate: string | null;
  coverMediaId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: AdminCampaignTranslation[];
}

export interface AdminCampaignListItem {
  id: number;
  statusLifecycle: CampaignLifecycle;
  startDate: string | null;
  endDate: string | null;
  createdAt: Date;
  bn: { status: "draft" | "published" | "missing"; title: string | null };
  en: { status: "draft" | "published" | "missing"; title: string | null };
  ar: { status: "draft" | "published" | "missing"; title: string | null };
}

export async function getAdminCampaignList(
  lifecycle?: CampaignLifecycle,
  limit = 50,
  offset = 0
): Promise<AdminCampaignListItem[]> {
  try {
    const whereClause = lifecycle
      ? and(
        isNull(schema.campaigns.deletedAt),
        eq(schema.campaigns.statusLifecycle, lifecycle)
      )
      : isNull(schema.campaigns.deletedAt);

    const rows = await db
      .select({
        id: schema.campaigns.id,
        statusLifecycle: schema.campaigns.statusLifecycle,
        startDate: schema.campaigns.startDate,
        endDate: schema.campaigns.endDate,
        createdAt: schema.campaigns.createdAt,
        locale: schema.campaignTranslations.locale,
        title: schema.campaignTranslations.title,
        status: schema.campaignTranslations.status,
      })
      .from(schema.campaigns)
      .leftJoin(
        schema.campaignTranslations,
        eq(schema.campaignTranslations.campaignId, schema.campaigns.id)
      )
      .where(whereClause)
      .orderBy(desc(schema.campaigns.createdAt))
      .limit(limit * 4)
      .offset(0);

    const map = new Map<number, AdminCampaignListItem>();
    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          statusLifecycle: row.statusLifecycle as CampaignLifecycle,
          startDate: row.startDate ?? null,
          endDate: row.endDate ?? null,
          createdAt: row.createdAt,
          bn: { status: "missing", title: null },
          en: { status: "missing", title: null },
          ar: { status: "missing", title: null },
        });
      }

      if (row.locale && row.status) {
        const item = map.get(row.id)!;
        const loc = row.locale as Locale;
        if (loc === "bn" || loc === "en" || loc === "ar") {
          item[loc] = {
            status: row.status as "draft" | "published",
            title: row.title,
          };
        }
      }
    }

    return Array.from(map.values()).slice(offset, offset + limit);
  } catch {
    return [];
  }
}

export async function getAdminCampaignById(
  campaignId: number
): Promise<AdminCampaignDetail | null> {
  try {
    const [campaign] = await db
      .select()
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);

    if (!campaign) return null;

    const translationRows = await db
      .select()
      .from(schema.campaignTranslations)
      .where(eq(schema.campaignTranslations.campaignId, campaignId));

    const translationMap = new Map(translationRows.map((t) => [t.locale, t]));
    const translations: AdminCampaignTranslation[] = locales.map((locale) => {
      const t = translationMap.get(locale);
      if (!t) {
        return {
          id: null,
          locale,
          title: "",
          slug: "",
          excerpt: null,
          body: "",
          goals: null,
          seoTitle: null,
          metaDescription: null,
          ogTitle: null,
          ogDescription: null,
          status: "draft",
          publishedAt: null,
          updatedAt: null,
        };
      }
      return {
        id: t.id,
        locale: t.locale as Locale,
        title: t.title,
        slug: t.slug,
        excerpt: t.excerpt ?? null,
        body: t.body,
        goals: t.goals ?? null,
        seoTitle: t.seoTitle ?? null,
        metaDescription: t.metaDescription ?? null,
        ogTitle: t.ogTitle ?? null,
        ogDescription: t.ogDescription ?? null,
        status: t.status as "draft" | "published",
        publishedAt: t.publishedAt ?? null,
        updatedAt: t.updatedAt ?? null,
      };
    });

    return {
      id: campaign.id,
      statusLifecycle: campaign.statusLifecycle as CampaignLifecycle,
      startDate: campaign.startDate ?? null,
      endDate: campaign.endDate ?? null,
      coverMediaId: campaign.coverMediaId ?? null,
      deletedAt: campaign.deletedAt ?? null,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt,
      translations,
    };
  } catch {
    return null;
  }
}

export async function isCampaignSlugAvailable(
  locale: Locale,
  slug: string,
  currentCampaignId: number | null
): Promise<boolean> {
  try {
    const [existing] = await db
      .select({ entityId: schema.slugReservations.entityId })
      .from(schema.slugReservations)
      .where(
        and(
          eq(schema.slugReservations.entityType, "campaign"),
          eq(schema.slugReservations.locale, locale),
          eq(schema.slugReservations.slug, slug)
        )
      )
      .limit(1);

    if (!existing) return true;
    if (currentCampaignId !== null && existing.entityId === currentCampaignId) return true;
    return false;
  } catch {
    return false;
  }
}
