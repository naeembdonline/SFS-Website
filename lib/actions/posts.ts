"use server";

/**
 * Posts Server Actions — Create, Update, Publish, Unpublish, Soft-Delete.
 *
 * Every mutation:
 *  1. Is guarded by withAdmin (session check + role check)
 *  2. Validates inputs with Zod
 *  3. Checks slug availability against slug_reservations
 *  4. Executes the DB mutation and audit log write in a single transaction
 *  5. Calls revalidateTag() to bust the public cache
 *
 * Slug rules:
 *  - Each locale's slug must be unique per (entity_type='post', locale, slug)
 *  - On create: insert into slug_reservations for each locale
 *  - On update: if slug changed, update slug_reservations; if the translation
 *    was previously published, also write a slug_redirects row
 *  - On delete: slug_reservations rows remain (slugs are never recycled)
 */

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import { isSlugAvailable } from "@/lib/data/admin/posts";
import {
  createPostSchema,
  updatePostSchema,
  publishPostSchema,
  deletePostSchema,
  parseCreatePostFormData,
  parseUpdatePostFormData,
  type PostDraftTranslationInput,
} from "@/lib/validation/posts";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function revalidatePostTags(type: string) {
  revalidateTag(`posts-${type}`, "max");
  for (const locale of locales) {
    revalidateTag(`posts-${type}-${locale}`, "max");
  }
}

type TranslationMap = Record<Locale, PostDraftTranslationInput>;

async function validateSlugs(
  translations: TranslationMap,
  postId: number | null
): Promise<void> {
  for (const locale of locales) {
    const slug = translations[locale].slug;
    if (!slug) continue;
    const available = await isSlugAvailable(locale, slug, postId);
    if (!available) {
      throw new ActionError(
        `The slug "${slug}" is already in use for ${locale}. Please choose a different slug.`,
        "SLUG_CONFLICT"
      );
    }
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createPostAction(
  _prev: ActionState<{ id: number }>,
  formData: FormData
): Promise<ActionState<{ id: number }>> {
  return withAdmin(async (ctx) => {
    // 1. Parse + validate
    const raw = parseCreatePostFormData(formData);
    const parsed = createPostSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(
        parsed.error.issues[0]?.message ?? "Validation failed",
        "VALIDATION_ERROR"
      );
    }
    const input = parsed.data;
    const translations: TranslationMap = { bn: input.bn, en: input.en, ar: input.ar };

    // 2. Slug uniqueness check
    await validateSlugs(translations, null);

    // 3. Mutate inside transaction
    let newPostId!: number;

    await db.transaction(async (tx) => {
      // Insert parent post row
      const [newPost] = await tx
        .insert(schema.posts)
        .values({
          type: input.type,
          authorUserId: ctx.user.id,
        })
        .returning({ id: schema.posts.id });

      newPostId = newPost.id;

      // Insert translation rows
      for (const locale of locales) {
        const t = translations[locale];
        await tx.insert(schema.postTranslations).values({
          postId: newPostId,
          locale,
          title: t.title,
          slug: t.slug,
          excerpt: t.excerpt ?? null,
          body: t.body,
          seoTitle: t.seoTitle ?? null,
          metaDescription: t.metaDescription ?? null,
          ogTitle: t.ogTitle ?? null,
          ogDescription: t.ogDescription ?? null,
          status: "draft",
        });

        // Reserve only completed draft slugs; empty untranslated tabs are valid drafts.
        if (t.slug) {
          await tx.insert(schema.slugReservations).values({
            entityType: "post",
            locale,
            slug: t.slug,
            entityId: newPostId,
          });
        }
      }

      // Audit log
      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "post.create",
        entityType: "post",
        entityId: newPostId,
        diff: {
          type: input.type,
          bn_title: input.bn.title,
          en_title: input.en.title,
          ar_title: input.ar.title,
        },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePostTags(input.type);

    // Redirect to the edit page
    redirect(`/admin/posts/${newPostId}`);
  });
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updatePostAction(
  postId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    // 1. Parse + validate
    const raw = parseUpdatePostFormData(formData, postId);
    const parsed = updatePostSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(
        parsed.error.issues[0]?.message ?? "Validation failed",
        "VALIDATION_ERROR"
      );
    }
    const input = parsed.data;
    const translations: TranslationMap = { bn: input.bn, en: input.en, ar: input.ar };

    // 2. Load existing translations to compare slugs
    const existingTranslations = await db
      .select({
        locale: schema.postTranslations.locale,
        slug: schema.postTranslations.slug,
        status: schema.postTranslations.status,
        id: schema.postTranslations.id,
      })
      .from(schema.postTranslations)
      .where(eq(schema.postTranslations.postId, postId));

    const existingMap = new Map(
      existingTranslations.map((t) => [t.locale, t])
    );

    // 3. Slug uniqueness check (only for slugs that changed)
    for (const locale of locales) {
      const newSlug = translations[locale].slug;
      if (!newSlug) continue;
      const existing = existingMap.get(locale);
      if (existing && existing.slug === newSlug) continue; // unchanged
      const available = await isSlugAvailable(locale, newSlug, postId);
      if (!available) {
        throw new ActionError(
          `The slug "${newSlug}" is already in use for ${locale}.`,
          "SLUG_CONFLICT"
        );
      }
    }

    // 4. Get post type for cache invalidation
    const [post] = await db
      .select({ type: schema.posts.type })
      .from(schema.posts)
      .where(eq(schema.posts.id, postId))
      .limit(1);

    if (!post) throw new ActionError("Post not found", "NOT_FOUND");

    // 5. Mutate inside transaction
    await db.transaction(async (tx) => {
      for (const locale of locales) {
        const t = translations[locale];
        const existing = existingMap.get(locale);

        if (existing) {
          // Update existing translation
          await tx
            .update(schema.postTranslations)
            .set({
              title: t.title,
              slug: t.slug,
              excerpt: t.excerpt ?? null,
              body: t.body,
              seoTitle: t.seoTitle ?? null,
              metaDescription: t.metaDescription ?? null,
              ogTitle: t.ogTitle ?? null,
              ogDescription: t.ogDescription ?? null,
              updatedAt: new Date(),
            })
            .where(eq(schema.postTranslations.id, existing.id));

          // Handle slug change
          if (existing.slug !== t.slug) {
            // If previously published, write redirect for old slug
            if (existing.status === "published" && existing.slug && t.slug) {
              await tx.insert(schema.slugRedirects).values({
                entityType: "post",
                locale,
                oldSlug: existing.slug,
                entityId: postId,
                createdByUserId: ctx.user.id,
              });
            }
            if (t.slug) {
              // Update existing reservation, or create one if this locale was previously empty.
              const updatedReservations = await tx
                .update(schema.slugReservations)
                .set({ slug: t.slug })
                .where(
                  and(
                    eq(schema.slugReservations.entityType, "post"),
                    eq(schema.slugReservations.locale, locale),
                    eq(schema.slugReservations.entityId, postId)
                  )
                )
                .returning({ id: schema.slugReservations.id });

              if (updatedReservations.length === 0) {
                await tx.insert(schema.slugReservations).values({
                  entityType: "post",
                  locale,
                  slug: t.slug,
                  entityId: postId,
                });
              }
            }
          }
        } else {
          // Insert new translation row
          await tx.insert(schema.postTranslations).values({
            postId,
            locale,
            title: t.title,
            slug: t.slug,
            excerpt: t.excerpt ?? null,
            body: t.body,
            seoTitle: t.seoTitle ?? null,
            metaDescription: t.metaDescription ?? null,
            ogTitle: t.ogTitle ?? null,
            ogDescription: t.ogDescription ?? null,
            status: "draft",
          });

          if (t.slug) {
            await tx.insert(schema.slugReservations).values({
              entityType: "post",
              locale,
              slug: t.slug,
              entityId: postId,
            });
          }
        }
      }

      // Update parent updatedAt
      await tx
        .update(schema.posts)
        .set({ updatedAt: new Date() })
        .where(eq(schema.posts.id, postId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "post.update",
        entityType: "post",
        entityId: postId,
        diff: {
          bn_title: input.bn.title,
          en_title: input.en.title,
          ar_title: input.ar.title,
        },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePostTags(post.type);
  });
}

// ─── Publish ──────────────────────────────────────────────────────────────────

export async function publishPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishPostSchema.safeParse({
      postId: Number(formData.get("postId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) {
      throw new ActionError("Invalid input", "VALIDATION_ERROR");
    }
    const { postId, locale } = parsed.data;

    // Load the translation
    const [translation] = await db
      .select({
        id: schema.postTranslations.id,
        title: schema.postTranslations.title,
        body: schema.postTranslations.body,
        metaDescription: schema.postTranslations.metaDescription,
        slug: schema.postTranslations.slug,
        status: schema.postTranslations.status,
      })
      .from(schema.postTranslations)
      .where(
        and(
          eq(schema.postTranslations.postId, postId),
          eq(schema.postTranslations.locale, locale)
        )
      )
      .limit(1);

    if (!translation) {
      throw new ActionError(`No ${locale} translation found for this post`, "NOT_FOUND");
    }

    // Validate required fields before publishing
    if (!translation.title?.trim()) {
      throw new ActionError("Title is required before publishing", "VALIDATION_ERROR");
    }
    if (!translation.body?.trim()) {
      throw new ActionError("Body is required before publishing", "VALIDATION_ERROR");
    }
    if (!translation.slug?.trim()) {
      throw new ActionError("Slug is required before publishing", "VALIDATION_ERROR");
    }
    if (!translation.metaDescription?.trim()) {
      throw new ActionError("Meta description is required before publishing", "VALIDATION_ERROR");
    }

    const now = new Date();

    const [post] = await db
      .select({ type: schema.posts.type, firstPublishedAt: schema.posts.firstPublishedAt })
      .from(schema.posts)
      .where(eq(schema.posts.id, postId))
      .limit(1);

    if (!post) throw new ActionError("Post not found", "NOT_FOUND");

    await db.transaction(async (tx) => {
      const [updatedTranslation] = await tx
        .update(schema.postTranslations)
        .set({
          status: "published",
          publishedAt: now,
          updatedAt: now,
        })
        .where(eq(schema.postTranslations.id, translation.id))
        .returning({ id: schema.postTranslations.id });

      if (!updatedTranslation) {
        throw new ActionError("Post translation could not be published", "UPDATE_FAILED");
      }

      // Set firstPublishedAt on parent if this is the first publish
      if (!post.firstPublishedAt) {
        await tx
          .update(schema.posts)
          .set({ firstPublishedAt: now, updatedAt: now })
          .where(eq(schema.posts.id, postId));
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "post.publish",
        entityType: "post",
        entityId: postId,
        localeAffected: locale,
        diff: { title: translation.title, slug: translation.slug },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePostTags(post.type);
    // Also invalidate the specific slug cache
    revalidateTag(`post-slug-${locale}-${translation.slug}`, "max");
    revalidatePath(`/admin/posts/${postId}`);
  });
}

// ─── Unpublish ────────────────────────────────────────────────────────────────

export async function unpublishPostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishPostSchema.safeParse({
      postId: Number(formData.get("postId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) {
      throw new ActionError("Invalid input", "VALIDATION_ERROR");
    }
    const { postId, locale } = parsed.data;

    const [translation] = await db
      .select({
        id: schema.postTranslations.id,
        slug: schema.postTranslations.slug,
      })
      .from(schema.postTranslations)
      .where(
        and(
          eq(schema.postTranslations.postId, postId),
          eq(schema.postTranslations.locale, locale)
        )
      )
      .limit(1);

    if (!translation) {
      throw new ActionError("Translation not found", "NOT_FOUND");
    }

    const [post] = await db
      .select({ type: schema.posts.type })
      .from(schema.posts)
      .where(eq(schema.posts.id, postId))
      .limit(1);

    if (!post) throw new ActionError("Post not found", "NOT_FOUND");

    await db.transaction(async (tx) => {
      const [updatedTranslation] = await tx
        .update(schema.postTranslations)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(schema.postTranslations.id, translation.id))
        .returning({ id: schema.postTranslations.id });

      if (!updatedTranslation) {
        throw new ActionError("Post translation could not be unpublished", "UPDATE_FAILED");
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "post.unpublish",
        entityType: "post",
        entityId: postId,
        localeAffected: locale,
        diff: { slug: translation.slug },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePostTags(post.type);
    revalidateTag(`post-slug-${locale}-${translation.slug}`, "max");
    revalidatePath(`/admin/posts/${postId}`);
  });
}

// ─── Soft Delete ──────────────────────────────────────────────────────────────

export async function deletePostAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = deletePostSchema.safeParse({
      postId: Number(formData.get("postId")),
    });
    if (!parsed.success) {
      throw new ActionError("Invalid input", "VALIDATION_ERROR");
    }
    const { postId } = parsed.data;

    const [post] = await db
      .select({ type: schema.posts.type, deletedAt: schema.posts.deletedAt })
      .from(schema.posts)
      .where(eq(schema.posts.id, postId))
      .limit(1);

    if (!post) throw new ActionError("Post not found", "NOT_FOUND");
    if (post.deletedAt) throw new ActionError("Post is already deleted", "ALREADY_DELETED");

    await db.transaction(async (tx) => {
      await tx
        .update(schema.posts)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.posts.id, postId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "post.delete",
        entityType: "post",
        entityId: postId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePostTags(post.type);
    redirect("/admin/posts");
  });
}
