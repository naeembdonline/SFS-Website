/**
 * Admin data layer — Posts.
 *
 * Import boundary: ONLY from (admin) routes and Server Actions.
 * NEVER use 'use cache' here — admin data must always be fresh.
 * NEVER filter by status='published' — admins see all statuses.
 */

import { eq, and, isNull, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostType = "blog" | "news";

export interface AdminTranslation {
  id: number | null;
  locale: Locale;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  status: "draft" | "published";
  publishedAt: Date | null;
  updatedAt: Date | null;
}

export interface AdminPostDetail {
  id: number;
  type: PostType;
  coverMediaId: number | null;
  authorUserId: number | null;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  translations: AdminTranslation[];
}

export interface AdminPostListItem {
  id: number;
  type: PostType;
  deletedAt: Date | null;
  createdAt: Date;
  // Per-locale status summary
  bn: { status: "draft" | "published" | "missing"; title: string | null };
  en: { status: "draft" | "published" | "missing"; title: string | null };
  ar: { status: "draft" | "published" | "missing"; title: string | null };
}

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getAdminPostList(
  type?: PostType,
  limit = 50,
  offset = 0
): Promise<AdminPostListItem[]> {
  try {
    const whereClause = type
      ? and(isNull(schema.posts.deletedAt), eq(schema.posts.type, type))
      : isNull(schema.posts.deletedAt);

    const rows = await db
      .select({
        id: schema.posts.id,
        type: schema.posts.type,
        deletedAt: schema.posts.deletedAt,
        createdAt: schema.posts.createdAt,
        locale: schema.postTranslations.locale,
        title: schema.postTranslations.title,
        status: schema.postTranslations.status,
      })
      .from(schema.posts)
      .leftJoin(
        schema.postTranslations,
        eq(schema.postTranslations.postId, schema.posts.id)
      )
      .where(whereClause)
      .orderBy(desc(schema.posts.createdAt))
      .limit(limit * 4) // account for up to 3 translation rows per post
      .offset(0);

    // Group by post id
    const map = new Map<number, AdminPostListItem>();

    for (const row of rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          type: row.type as PostType,
          deletedAt: row.deletedAt,
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

    // Return paginated slice of the map
    const items = Array.from(map.values());
    return items.slice(offset, offset + limit);
  } catch {
    return [];
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getAdminPostById(
  postId: number
): Promise<AdminPostDetail | null> {
  try {
    const [post] = await db
      .select()
      .from(schema.posts)
      .where(eq(schema.posts.id, postId))
      .limit(1);

    if (!post) return null;

    const translationRows = await db
      .select()
      .from(schema.postTranslations)
      .where(eq(schema.postTranslations.postId, postId));

    // Build a map of locale → translation
    const translationMap = new Map(
      translationRows.map((t) => [t.locale, t])
    );

    // Return all 3 locales; missing ones get empty defaults
    const translations: AdminTranslation[] = locales.map((locale) => {
      const t = translationMap.get(locale);
      if (!t) {
        return {
          id: null,
          locale,
          title: "",
          slug: "",
          excerpt: null,
          body: "",
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
      id: post.id,
      type: post.type as PostType,
      coverMediaId: post.coverMediaId ?? null,
      authorUserId: post.authorUserId ?? null,
      deletedAt: post.deletedAt ?? null,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      translations,
    };
  } catch {
    return null;
  }
}

// ─── Slug availability check ──────────────────────────────────────────────────

/**
 * Returns true if the slug is available for the given (locale, entityId).
 * A slug is available if no other post has reserved it in the same locale.
 */
export async function isSlugAvailable(
  locale: Locale,
  slug: string,
  currentPostId: number | null
): Promise<boolean> {
  try {
    const [existing] = await db
      .select({ entityId: schema.slugReservations.entityId })
      .from(schema.slugReservations)
      .where(
        and(
          eq(schema.slugReservations.entityType, "post"),
          eq(schema.slugReservations.locale, locale),
          eq(schema.slugReservations.slug, slug)
        )
      )
      .limit(1);

    if (!existing) return true;
    if (currentPostId !== null && existing.entityId === currentPostId) return true;
    return false;
  } catch {
    return false;
  }
}
