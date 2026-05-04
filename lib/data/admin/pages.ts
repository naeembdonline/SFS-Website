import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";
import type { PageSection } from "@/lib/db/schema/content";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PageKey = "home" | "about" | "contact" | "privacy" | "terms";

export interface AdminPageTranslation {
  id: number | null;
  locale: Locale;
  title: string;
  slug: string | null;
  body: string | null;
  sections: PageSection[] | null;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date | null;
}

export interface AdminPageDetail {
  id: number;
  key: PageKey;
  createdAt: Date;
  updatedAt: Date;
  translations: AdminPageTranslation[];
}

export interface AdminPageListItem {
  id: number;
  key: PageKey;
  bn: { status: "draft" | "published" | "missing"; title: string | null };
  en: { status: "draft" | "published" | "missing"; title: string | null };
  ar: { status: "draft" | "published" | "missing"; title: string | null };
}

// ─── List ────────────────────────────────────────────────────────────────────

export async function getAdminPageList(): Promise<AdminPageListItem[]> {
  try {
    const rows = await db
      .select({
        id: schema.pages.id,
        key: schema.pages.key,
        locale: schema.pageTranslations.locale,
        title: schema.pageTranslations.title,
        status: schema.pageTranslations.status,
      })
      .from(schema.pages)
      .leftJoin(
        schema.pageTranslations,
        eq(schema.pageTranslations.pageId, schema.pages.id)
      );

    const map = new Map<number, AdminPageListItem>();

    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          key: row.key as PageKey,
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
            title: row.title ?? null,
          };
        }
      }
    }

    // Return in a stable order matching the PAGE_KEYS list
    const PAGE_ORDER: PageKey[] = ["home", "about", "contact", "privacy", "terms"];
    return Array.from(map.values()).sort(
      (a, b) => PAGE_ORDER.indexOf(a.key) - PAGE_ORDER.indexOf(b.key)
    );
  } catch {
    return [];
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getAdminPageById(
  pageId: number
): Promise<AdminPageDetail | null> {
  try {
    const [page] = await db
      .select()
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);

    if (!page) return null;

    const translationRows = await db
      .select()
      .from(schema.pageTranslations)
      .where(eq(schema.pageTranslations.pageId, pageId));

    const translationMap = new Map(translationRows.map((t) => [t.locale, t]));

    const translations: AdminPageTranslation[] = locales.map((locale) => {
      const t = translationMap.get(locale);
      if (!t) {
        return {
          id: null,
          locale,
          title: "",
          slug: null,
          body: null,
          sections: null,
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
        slug: t.slug ?? null,
        body: t.body ?? null,
        sections: (t.sections as PageSection[] | null) ?? null,
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
      id: page.id,
      key: page.key as PageKey,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
      translations,
    };
  } catch {
    return null;
  }
}
