/**
 * Public data — blog & news posts.
 * Both types share the posts table; differentiated by type column.
 * Import boundary: public routes only.
 */

// import { cacheTag } from "next/cache"; // Disabled for Cloudflare Pages compatibility
import { eq, and, isNull, desc, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PostType = "blog" | "news";

export type PublishedSlug = {
  slug: string;
  updatedAt: Date;
};

export type PostListItem = {
  id: number;
  type: PostType;
  slug: string;
  title: string;
  excerpt: string | null;
  publishedAt: Date | null;
  coverMediaId: number | null;
};

export type PostDetail = PostListItem & {
  body: string;
  seoTitle: string | null;
  metaDescription: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImageId: number | null;
  authorUserId: number | null;
  availableLocales: Locale[];
};

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getPostList(
  type: PostType,
  locale: Locale,
  limit = 20,
  offset = 0
): Promise<PostListItem[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`posts-${type}`, `posts-${type}-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        id: schema.posts.id,
        type: schema.posts.type,
        slug: schema.postTranslations.slug,
        title: schema.postTranslations.title,
        excerpt: schema.postTranslations.excerpt,
        publishedAt: schema.postTranslations.publishedAt,
        coverMediaId: schema.posts.coverMediaId,
      })
      .from(schema.posts)
      .innerJoin(
        schema.postTranslations,
        and(
          eq(schema.postTranslations.postId, schema.posts.id),
          eq(schema.postTranslations.locale, locale),
          eq(schema.postTranslations.status, "published")
        )
      )
      .where(
        and(
          eq(schema.posts.type, type),
          isNull(schema.posts.deletedAt)
        )
      )
      .orderBy(desc(schema.postTranslations.publishedAt))
      .limit(limit)
      .offset(offset);

    if (rows.length === 0) {
      const { DEMO_NEWS, DEMO_BLOG } = await import("@/lib/data/demo");
      const pool = type === "news" ? DEMO_NEWS : DEMO_BLOG;
      return (pool[locale] ?? []).slice(offset, offset + limit);
    }
    return rows.map((r) => ({
      id: r.id,
      type: r.type as PostType,
      slug: r.slug,
      title: r.title,
      excerpt: r.excerpt ?? null,
      publishedAt: r.publishedAt ?? null,
      coverMediaId: r.coverMediaId ?? null,
    }));
  } catch {
    const { DEMO_NEWS, DEMO_BLOG } = await import("@/lib/data/demo");
    const pool = type === "news" ? DEMO_NEWS : DEMO_BLOG;
    return (pool[locale] ?? []).slice(offset, offset + limit);
  }
}

// ─── Detail ───────────────────────────────────────────────────────────────────

export async function getPostBySlug(
  type: PostType,
  slug: string,
  locale: Locale
): Promise<PostDetail | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(
  //   `posts-${type}`,
  //   `posts-${type}-${locale}`,
  //   `post-slug-${locale}-${slug}`
  // ); // Disabled for Cloudflare Pages compatibility

  try {
    const [row] = await db
      .select({
        id: schema.posts.id,
        type: schema.posts.type,
        slug: schema.postTranslations.slug,
        title: schema.postTranslations.title,
        excerpt: schema.postTranslations.excerpt,
        body: schema.postTranslations.body,
        publishedAt: schema.postTranslations.publishedAt,
        coverMediaId: schema.posts.coverMediaId,
        seoTitle: schema.postTranslations.seoTitle,
        metaDescription: schema.postTranslations.metaDescription,
        ogTitle: schema.postTranslations.ogTitle,
        ogDescription: schema.postTranslations.ogDescription,
        ogImageId: schema.postTranslations.ogImageId,
        authorUserId: schema.posts.authorUserId,
      })
      .from(schema.posts)
      .innerJoin(
        schema.postTranslations,
        and(
          eq(schema.postTranslations.postId, schema.posts.id),
          eq(schema.postTranslations.locale, locale),
          eq(schema.postTranslations.slug, slug),
          eq(schema.postTranslations.status, "published")
        )
      )
      .where(
        and(
          eq(schema.posts.type, type),
          isNull(schema.posts.deletedAt)
        )
      )
      .limit(1);

    if (!row) return null;

    const siblings = await db
      .select({ locale: schema.postTranslations.locale })
      .from(schema.postTranslations)
      .where(
        and(
          eq(schema.postTranslations.postId, row.id),
          eq(schema.postTranslations.status, "published"),
          ne(schema.postTranslations.locale, locale)
        )
      );

    return {
      id: row.id,
      type: row.type as PostType,
      slug: row.slug,
      title: row.title,
      excerpt: row.excerpt ?? null,
      body: row.body,
      publishedAt: row.publishedAt ?? null,
      coverMediaId: row.coverMediaId ?? null,
      seoTitle: row.seoTitle ?? null,
      metaDescription: row.metaDescription ?? null,
      ogTitle: row.ogTitle ?? null,
      ogDescription: row.ogDescription ?? null,
      ogImageId: row.ogImageId ?? null,
      authorUserId: row.authorUserId ?? null,
      availableLocales: siblings.map((s) => s.locale as Locale),
    };
  } catch {
    return null;
  }
}

// ─── Fallback — find all published locale+slug pairs for a slug in any locale ─

export async function getPostLocalesBySlug(
  type: PostType,
  slug: string
): Promise<{ locale: Locale; slug: string }[] | null> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`posts-${type}`); // Disabled for Cloudflare Pages compatibility

  try {
    // Step 1: find the post that owns this slug in any published locale
    const [found] = await db
      .select({ postId: schema.postTranslations.postId })
      .from(schema.postTranslations)
      .innerJoin(
        schema.posts,
        and(
          eq(schema.posts.id, schema.postTranslations.postId),
          eq(schema.posts.type, type),
          isNull(schema.posts.deletedAt)
        )
      )
      .where(
        and(
          eq(schema.postTranslations.slug, slug),
          eq(schema.postTranslations.status, "published")
        )
      )
      .limit(1);

    if (!found) return null;

    // Step 2: return all published locale+slug pairs for that post
    const rows = await db
      .select({
        locale: schema.postTranslations.locale,
        slug: schema.postTranslations.slug,
      })
      .from(schema.postTranslations)
      .where(
        and(
          eq(schema.postTranslations.postId, found.postId),
          eq(schema.postTranslations.status, "published")
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

export async function getPublishedPostSlugs(
  type: PostType,
  locale: Locale
): Promise<PublishedSlug[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`posts-${type}`, `posts-${type}-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        slug: schema.postTranslations.slug,
        updatedAt: schema.postTranslations.updatedAt,
      })
      .from(schema.postTranslations)
      .innerJoin(
        schema.posts,
        and(
          eq(schema.posts.id, schema.postTranslations.postId),
          isNull(schema.posts.deletedAt),
          eq(schema.posts.type, type)
        )
      )
      .where(
        and(
          eq(schema.postTranslations.locale, locale),
          eq(schema.postTranslations.status, "published")
        )
      );

    return rows;
  } catch {
    return [];
  }
}
