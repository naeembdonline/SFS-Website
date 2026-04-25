/**
 * Zod schemas for Posts admin mutations.
 * Applied in Server Actions before any DB operation.
 */

import { z } from "zod";

// ─── Slug ─────────────────────────────────────────────────────────────────────

// Reserved slugs that must not be used as content slugs.
const RESERVED_SLUGS = new Set([
  "admin", "api", "_next", "static", "public", "assets", "media", "uploads",
  "auth", "login", "logout", "robots.txt", "sitemap.xml", "favicon.ico",
  "manifest.json", "health", "og", "rss", "feed", "bn", "en", "ar",
  "new", "edit", "draft", "preview", "page", "tag", "category",
  "archive", "search",
]);

/**
 * URL-safe slug: must start/end with a letter/digit/Unicode letter,
 * can contain hyphens in the middle. Bangla and Arabic Unicode accepted.
 * No spaces, slashes, query chars, or fragment chars.
 */
const slugSchema = z
  .string()
  .min(2, "Slug must be at least 2 characters")
  .max(200, "Slug must be under 200 characters")
  .regex(/^[\p{L}\p{M}\p{N}-]+$/u, {
    message: "Slug cannot contain spaces or URL-unsafe characters",
  })
  .refine((s) => !RESERVED_SLUGS.has(s.toLowerCase()), {
    message: "This slug is reserved and cannot be used",
  });

// ─── Per-locale translation ───────────────────────────────────────────────────

export const postTranslationSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: slugSchema,
  excerpt: z.string().max(1000).optional().nullable(),
  body: z.string().min(1, "Body is required"),
  seoTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(300).optional().nullable(),
});

export type PostTranslationInput = z.infer<typeof postTranslationSchema>;

const draftSlugSchema = z.union([z.literal(""), slugSchema]);

export const postDraftTranslationSchema = z
  .object({
    title: z.string().max(500),
    slug: draftSlugSchema,
    excerpt: z.string().max(1000).optional().nullable(),
    body: z.string(),
    seoTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(300).optional().nullable(),
    ogTitle: z.string().max(200).optional().nullable(),
    ogDescription: z.string().max(300).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    const hasAnyLocaleContent = [
      value.slug,
      value.excerpt,
      value.body,
      value.seoTitle,
      value.metaDescription,
      value.ogTitle,
      value.ogDescription,
    ].some((field) => typeof field === "string" && field.trim().length > 0);

    if (hasAnyLocaleContent && value.title.trim().length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["title"],
        message: "Title is required for locales with draft content",
      });
    }
  });

export type PostDraftTranslationInput = z.infer<typeof postDraftTranslationSchema>;

/**
 * A partial translation: all fields optional.
 * Used when only some fields are being updated.
 */
export const postTranslationPartialSchema = postTranslationSchema.partial();

// ─── Create post ──────────────────────────────────────────────────────────────

export const createPostSchema = z.object({
  type: z.enum(["blog", "news"]),
  // Draft saves may leave untranslated locales empty.
  bn: postDraftTranslationSchema,
  en: postDraftTranslationSchema,
  ar: postDraftTranslationSchema,
}).refine(
  (value) =>
    [value.bn, value.en, value.ar].some(
      (translation) => translation.title.trim().length > 0
    ),
  { message: "Add a title in at least one language before saving" }
);

export type CreatePostInput = z.infer<typeof createPostSchema>;

// ─── Update post ──────────────────────────────────────────────────────────────

export const updatePostSchema = z.object({
  postId: z.number().int().positive(),
  bn: postDraftTranslationSchema,
  en: postDraftTranslationSchema,
  ar: postDraftTranslationSchema,
}).refine(
  (value) =>
    [value.bn, value.en, value.ar].some(
      (translation) => translation.title.trim().length > 0
    ),
  { message: "Add a title in at least one language before saving" }
);

export type UpdatePostInput = z.infer<typeof updatePostSchema>;

// ─── Publish / Unpublish ──────────────────────────────────────────────────────

export const publishPostSchema = z.object({
  postId: z.number().int().positive(),
  locale: z.enum(["bn", "en", "ar"]),
});

export type PublishPostInput = z.infer<typeof publishPostSchema>;

// ─── Delete ───────────────────────────────────────────────────────────────────

export const deletePostSchema = z.object({
  postId: z.number().int().positive(),
});

export type DeletePostInput = z.infer<typeof deletePostSchema>;

// ─── FormData parser ─────────────────────────────────────────────────────────

/**
 * Parses a flat FormData object into the structured CreatePostInput / UpdatePostInput shape.
 * Form fields are named: {locale}_{field} e.g. bn_title, en_body, ar_slug
 */
function str(v: FormDataEntryValue | null): string {
  if (typeof v === "string") return v.trim();
  return "";
}
function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s.length > 0 ? s : null;
}

function parseTranslation(
  fd: FormData,
  locale: string
): PostDraftTranslationInput {
  return {
    title: str(fd.get(`${locale}_title`) ?? fd.get(`title_${locale}`)),
    slug: str(fd.get(`${locale}_slug`) ?? fd.get(`slug_${locale}`)),
    excerpt: strOrNull(fd.get(`${locale}_excerpt`) ?? fd.get(`excerpt_${locale}`)),
    body: str(fd.get(`${locale}_body`) ?? fd.get(`body_${locale}`)),
    seoTitle: strOrNull(fd.get(`${locale}_seo_title`) ?? fd.get(`seo_title_${locale}`)),
    metaDescription: strOrNull(
      fd.get(`${locale}_meta_description`) ?? fd.get(`meta_description_${locale}`)
    ),
    ogTitle: strOrNull(fd.get(`${locale}_og_title`) ?? fd.get(`og_title_${locale}`)),
    ogDescription: strOrNull(
      fd.get(`${locale}_og_description`) ?? fd.get(`og_description_${locale}`)
    ),
  };
}

export function parseCreatePostFormData(fd: FormData): CreatePostInput {
  return {
    type: str(fd.get("type")) as "blog" | "news",
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}

export function parseUpdatePostFormData(fd: FormData, postId: number): UpdatePostInput {
  return {
    postId,
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}
