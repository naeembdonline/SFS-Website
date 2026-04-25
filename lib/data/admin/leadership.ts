import { eq, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

export interface AdminLeadershipTranslation {
  id: number | null;
  locale: Locale;
  name: string;
  roleTitle: string | null;
  bio: string | null;
}

export interface AdminLeadershipItem {
  id: number;
  photoMediaId: number | null;
  displayOrder: number;
  isVisible: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: AdminLeadershipTranslation[];
}

export interface AdminLeadershipListItem {
  id: number;
  displayOrder: number;
  isVisible: boolean;
  bn: { name: string | null };
  en: { name: string | null };
  ar: { name: string | null };
}

export async function getAdminLeadershipList(): Promise<AdminLeadershipListItem[]> {
  const rows = await db
    .select({
      id: schema.leadership.id,
      displayOrder: schema.leadership.displayOrder,
      isVisible: schema.leadership.isVisible,
      locale: schema.leadershipTranslations.locale,
      name: schema.leadershipTranslations.name,
    })
    .from(schema.leadership)
    .leftJoin(
      schema.leadershipTranslations,
      eq(schema.leadershipTranslations.leadershipId, schema.leadership.id)
    )
    .where(isNull(schema.leadership.deletedAt))
    .orderBy(desc(schema.leadership.displayOrder));

  const map = new Map<number, AdminLeadershipListItem>();
  for (const row of rows) {
    if (!map.has(row.id)) {
      map.set(row.id, {
        id: row.id,
        displayOrder: Number(row.displayOrder),
        isVisible: row.isVisible,
        bn: { name: null },
        en: { name: null },
        ar: { name: null },
      });
    }
    if (row.locale) {
      const item = map.get(row.id)!;
      const locale = row.locale as Locale;
      item[locale] = { name: row.name };
    }
  }
  return Array.from(map.values());
}

export async function getAdminLeadershipById(id: number): Promise<AdminLeadershipItem | null> {
  const [member] = await db
    .select()
    .from(schema.leadership)
    .where(eq(schema.leadership.id, id))
    .limit(1);
  if (!member) return null;

  const translationRows = await db
    .select()
    .from(schema.leadershipTranslations)
    .where(eq(schema.leadershipTranslations.leadershipId, id));
  const byLocale = new Map(translationRows.map((t) => [t.locale, t]));

  const translations = locales.map((locale) => {
    const t = byLocale.get(locale);
    return t
      ? {
        id: t.id,
        locale,
        name: t.name,
        roleTitle: t.roleTitle ?? null,
        bio: t.bio ?? null,
      }
      : { id: null, locale, name: "", roleTitle: null, bio: null };
  });

  return {
    id: member.id,
    photoMediaId: member.photoMediaId ?? null,
    displayOrder: Number(member.displayOrder),
    isVisible: member.isVisible,
    deletedAt: member.deletedAt ?? null,
    createdAt: member.createdAt,
    updatedAt: member.updatedAt,
    translations,
  };
}
