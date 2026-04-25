/**
 * Public data — site settings & navigation.
 * Cached with 'use cache' + cacheTag for tag-based invalidation.
 * Import boundary: only used by public routes, never admin modules.
 */

import { cacheTag } from "next/cache";
import { eq, and, isNull, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SiteSettingsPublic = {
  siteName: string;
  tagline: string | null;
  footerText: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  socials: { platform: string; url: string }[];
};

export type NavItemPublic = {
  id: number;
  menu: "header" | "footer";
  displayOrder: number;
  linkKind: "route" | "external";
  routeKey: string | null;
  externalUrl: string | null;
  label: string;
};

// ─── Site settings ────────────────────────────────────────────────────────────

export async function getSiteSettings(
  locale: Locale
): Promise<SiteSettingsPublic | null> {
  "use cache";
  cacheTag(`site-settings`, `site-settings-${locale}`);

  try {
    const [row] = await db
      .select({
        siteName: schema.siteSettingsTranslations.siteName,
        tagline: schema.siteSettingsTranslations.tagline,
        footerText: schema.siteSettingsTranslations.footerText,
        contactEmail: schema.siteSettings.contactEmail,
        contactPhone: schema.siteSettings.contactPhone,
        address: schema.siteSettings.address,
        socials: schema.siteSettings.socials,
      })
      .from(schema.siteSettings)
      .innerJoin(
        schema.siteSettingsTranslations,
        eq(schema.siteSettingsTranslations.locale, locale)
      )
      .where(eq(schema.siteSettings.id, 1))
      .limit(1);

    if (!row) return null;

    return {
      siteName: row.siteName,
      tagline: row.tagline ?? null,
      footerText: row.footerText ?? null,
      contactEmail: row.contactEmail ?? null,
      contactPhone: row.contactPhone ?? null,
      address: row.address ?? null,
      socials: (row.socials as { platform: string; url: string }[]) ?? [],
    };
  } catch {
    // DB unavailable at build time — cache will be populated on first request
    return null;
  }
}

// ─── Navigation items ─────────────────────────────────────────────────────────

export async function getNavItems(
  menu: "header" | "footer",
  locale: Locale
): Promise<NavItemPublic[]> {
  "use cache";
  cacheTag(`nav-${menu}`, `nav-${menu}-${locale}`);

  try {
    const rows = await db
      .select({
        id: schema.navigationItems.id,
        menu: schema.navigationItems.menu,
        displayOrder: schema.navigationItems.displayOrder,
        linkKind: schema.navigationItems.linkKind,
        routeKey: schema.navigationItems.routeKey,
        externalUrl: schema.navigationItems.externalUrl,
        label: schema.navigationItemTranslations.label,
      })
      .from(schema.navigationItems)
      .innerJoin(
        schema.navigationItemTranslations,
        and(
          eq(
            schema.navigationItemTranslations.navigationItemId,
            schema.navigationItems.id
          ),
          eq(schema.navigationItemTranslations.locale, locale)
        )
      )
      .where(
        and(
          eq(schema.navigationItems.menu, menu),
          eq(schema.navigationItems.isVisible, true),
          isNull(schema.navigationItems.parentId)
        )
      )
      .orderBy(asc(schema.navigationItems.displayOrder));

    return rows.map((r) => ({
      id: r.id,
      menu: r.menu,
      displayOrder: r.displayOrder,
      linkKind: r.linkKind,
      routeKey: r.routeKey ?? null,
      externalUrl: r.externalUrl ?? null,
      label: r.label,
    }));
  } catch {
    return [];
  }
}
