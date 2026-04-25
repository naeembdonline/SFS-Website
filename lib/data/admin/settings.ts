import { eq, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

export interface AdminNavItem {
  id: number;
  menu: "header" | "footer";
  displayOrder: number;
  linkKind: "route" | "external";
  routeKey: string | null;
  externalUrl: string | null;
  isVisible: boolean;
  translations: Record<Locale, { label: string }>;
}

export async function getAdminNavItems(menu?: "header" | "footer"): Promise<AdminNavItem[]> {
  const base = db
    .select({
      id: schema.navigationItems.id,
      menu: schema.navigationItems.menu,
      displayOrder: schema.navigationItems.displayOrder,
      linkKind: schema.navigationItems.linkKind,
      routeKey: schema.navigationItems.routeKey,
      externalUrl: schema.navigationItems.externalUrl,
      isVisible: schema.navigationItems.isVisible,
      locale: schema.navigationItemTranslations.locale,
      label: schema.navigationItemTranslations.label,
    })
    .from(schema.navigationItems)
    .leftJoin(
      schema.navigationItemTranslations,
      eq(schema.navigationItemTranslations.navigationItemId, schema.navigationItems.id)
    )
    .orderBy(asc(schema.navigationItems.displayOrder));
  const rows = menu ? await base.where(eq(schema.navigationItems.menu, menu)) : await base;

  const map = new Map<number, AdminNavItem>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        menu: row.menu as "header" | "footer",
        displayOrder: row.displayOrder,
        linkKind: row.linkKind as "route" | "external",
        routeKey: row.routeKey ?? null,
        externalUrl: row.externalUrl ?? null,
        isVisible: row.isVisible,
        translations: { bn: { label: "" }, en: { label: "" }, ar: { label: "" } },
      });
    }
    if (row.locale) map.get(row.id)!.translations[row.locale as Locale] = { label: row.label ?? "" };
  }
  return Array.from(map.values());
}

export async function getAdminNavItemById(id: number): Promise<AdminNavItem | null> {
  const items = await getAdminNavItems();
  return items.find((i) => i.id === id) ?? null;
}

export interface AdminSiteSettings {
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  logoMediaId: number | null;
  defaultOgImageId: number | null;
  socials: { platform: string; url: string }[];
  translations: Record<
    Locale,
    {
      siteName: string;
      tagline: string | null;
      footerText: string | null;
      defaultMetaDescription: string | null;
    }
  >;
}

export async function getAdminSiteSettings(): Promise<AdminSiteSettings | null> {
  const [settings] = await db.select().from(schema.siteSettings).where(eq(schema.siteSettings.id, 1)).limit(1);
  if (!settings) return null;
  const rows = await db.select().from(schema.siteSettingsTranslations);
  const translations = Object.fromEntries(
    locales.map((locale) => [
      locale,
      {
        siteName: "",
        tagline: null,
        footerText: null,
        defaultMetaDescription: null,
      },
    ])
  ) as AdminSiteSettings["translations"];
  for (const row of rows) {
    translations[row.locale as Locale] = {
      siteName: row.siteName,
      tagline: row.tagline ?? null,
      footerText: row.footerText ?? null,
      defaultMetaDescription: row.defaultMetaDescription ?? null,
    };
  }
  return {
    contactEmail: settings.contactEmail ?? null,
    contactPhone: settings.contactPhone ?? null,
    address: settings.address ?? null,
    logoMediaId: settings.logoMediaId ?? null,
    defaultOgImageId: settings.defaultOgImageId ?? null,
    socials: (settings.socials as { platform: string; url: string }[]) ?? [],
    translations,
  };
}
