import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

export type ResourceKind = "pdf" | "link" | "doc";

export interface AdminResourceTranslation {
  id: number | null;
  locale: Locale;
  title: string;
  slug: string;
  description: string | null;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date | null;
}

export interface AdminResourceDetail {
  id: number;
  kind: ResourceKind;
  fileMediaId: number | null;
  externalUrl: string | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: AdminResourceTranslation[];
}

export interface AdminResourceListItem {
  id: number;
  kind: ResourceKind;
  createdAt: Date;
  bn: { status: "draft" | "published" | "missing"; title: string | null };
  en: { status: "draft" | "published" | "missing"; title: string | null };
  ar: { status: "draft" | "published" | "missing"; title: string | null };
}

export async function getAdminResourceList(
  kind?: ResourceKind,
  limit = 50,
  offset = 0
): Promise<AdminResourceListItem[]> {
  const whereClause = kind
    ? and(isNull(schema.resources.deletedAt), eq(schema.resources.kind, kind))
    : isNull(schema.resources.deletedAt);

  const rows = await db
    .select({
      id: schema.resources.id,
      kind: schema.resources.kind,
      createdAt: schema.resources.createdAt,
      locale: schema.resourceTranslations.locale,
      title: schema.resourceTranslations.title,
      status: schema.resourceTranslations.status,
    })
    .from(schema.resources)
    .leftJoin(
      schema.resourceTranslations,
      eq(schema.resourceTranslations.resourceId, schema.resources.id)
    )
    .where(whereClause)
    .orderBy(desc(schema.resources.createdAt))
    .limit(limit * 4)
    .offset(0);

  const map = new Map<number, AdminResourceListItem>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        kind: row.kind as ResourceKind,
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
}

export async function getAdminResourceById(
  resourceId: number
): Promise<AdminResourceDetail | null> {
  const [resource] = await db
    .select()
    .from(schema.resources)
    .where(eq(schema.resources.id, resourceId))
    .limit(1);

  if (!resource) return null;

  const translationRows = await db
    .select()
    .from(schema.resourceTranslations)
    .where(eq(schema.resourceTranslations.resourceId, resourceId));

  const translationMap = new Map(translationRows.map((t) => [t.locale, t]));
  const translations: AdminResourceTranslation[] = locales.map((locale) => {
    const t = translationMap.get(locale);
    if (!t) {
      return {
        id: null,
        locale,
        title: "",
        slug: "",
        description: null,
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
      description: t.description ?? null,
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
    id: resource.id,
    kind: resource.kind as ResourceKind,
    fileMediaId: resource.fileMediaId ?? null,
    externalUrl: resource.externalUrl ?? null,
    deletedAt: resource.deletedAt ?? null,
    createdAt: resource.createdAt,
    updatedAt: resource.updatedAt,
    translations,
  };
}

export async function isResourceSlugAvailable(
  locale: Locale,
  slug: string,
  currentResourceId: number | null
): Promise<boolean> {
  const [existing] = await db
    .select({ entityId: schema.slugReservations.entityId })
    .from(schema.slugReservations)
    .where(
      and(
        eq(schema.slugReservations.entityType, "resource"),
        eq(schema.slugReservations.locale, locale),
        eq(schema.slugReservations.slug, slug)
      )
    )
    .limit(1);

  if (!existing) return true;
  if (currentResourceId !== null && existing.entityId === currentResourceId) return true;
  return false;
}
