/**
 * Public data — slug redirects.
 * Import boundary: public routes only.
 */

import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

export async function getSlugRedirectTarget(
  oldSlug: string,
  locale: Locale
): Promise<string | null> {
  const [redirectRow] = await db
    .select({
      entityType: schema.slugRedirects.entityType,
      entityId: schema.slugRedirects.entityId,
    })
    .from(schema.slugRedirects)
    .where(
      and(
        eq(schema.slugRedirects.locale, locale),
        eq(schema.slugRedirects.oldSlug, oldSlug)
      )
    )
    .limit(1);

  if (!redirectRow) return null;

  const { entityType, entityId } = redirectRow;

  if (entityType === "post") {
    const [row] = await db
      .select({ slug: schema.postTranslations.slug, type: schema.posts.type })
      .from(schema.postTranslations)
      .innerJoin(
        schema.posts,
        and(
          eq(schema.posts.id, schema.postTranslations.postId),
          eq(schema.posts.id, entityId)
        )
      )
      .where(
        and(
          eq(schema.postTranslations.locale, locale),
          eq(schema.postTranslations.status, "published")
        )
      )
      .limit(1);

    return row ? `/${locale}/${row.type}/${row.slug}` : null;
  }

  if (entityType === "campaign") {
    const [row] = await db
      .select({ slug: schema.campaignTranslations.slug })
      .from(schema.campaignTranslations)
      .where(
        and(
          eq(schema.campaignTranslations.campaignId, entityId),
          eq(schema.campaignTranslations.locale, locale),
          eq(schema.campaignTranslations.status, "published")
        )
      )
      .limit(1);

    return row ? `/${locale}/campaigns/${row.slug}` : null;
  }

  if (entityType === "resource") {
    const [row] = await db
      .select({ slug: schema.resourceTranslations.slug })
      .from(schema.resourceTranslations)
      .where(
        and(
          eq(schema.resourceTranslations.resourceId, entityId),
          eq(schema.resourceTranslations.locale, locale),
          eq(schema.resourceTranslations.status, "published")
        )
      )
      .limit(1);

    return row ? `/${locale}/resources/${row.slug}` : null;
  }

  return null;
}
