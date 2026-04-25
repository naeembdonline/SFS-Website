/**
 * Zod schemas for Pages admin mutations.
 *
 * Pages are pre-seeded with stable keys (home, about, contact, privacy, terms).
 * There is no create or delete — only update and publish/unpublish per locale.
 *
 * Slug is nullable: keyed pages (home, contact, privacy, terms) use fixed routes
 * and do not need a slug. "about" and any future prose pages may carry one.
 *
 * Sections is a raw JSON string in FormData that is parsed and validated in the
 * action layer before being written to the DB as JSONB.
 */

import { z } from "zod";

export const pageTranslationSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: z
    .string()
    .max(200)
    .regex(/^[\p{L}\p{M}\p{N}-]+$/u, {
      message: "Slug cannot contain spaces or URL-unsafe characters",
    })
    .optional()
    .nullable(),
  body: z.string().max(100_000).optional().nullable(),
  // Raw JSON string — validated as a JSON array in the action
  sectionsJson: z.string().optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(300).optional().nullable(),
});

export type PageTranslationInput = z.infer<typeof pageTranslationSchema>;

export const updatePageSchema = z.object({
  pageId: z.number().int().positive(),
  bn: pageTranslationSchema,
  en: pageTranslationSchema,
  ar: pageTranslationSchema,
});

export type UpdatePageInput = z.infer<typeof updatePageSchema>;

export const publishPageSchema = z.object({
  pageId: z.number().int().positive(),
  locale: z.enum(["bn", "en", "ar"]),
});

// ─── FormData parsers ────────────────────────────────────────────────────────

function str(v: FormDataEntryValue | null): string {
  return typeof v === "string" ? v.trim() : "";
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s.length > 0 ? s : null;
}

function parseTranslation(fd: FormData, locale: string): PageTranslationInput {
  return {
    title: str(fd.get(`${locale}_title`)),
    slug: strOrNull(fd.get(`${locale}_slug`)),
    body: strOrNull(fd.get(`${locale}_body`)),
    sectionsJson: strOrNull(fd.get(`${locale}_sections_json`)),
    seoTitle: strOrNull(fd.get(`${locale}_seo_title`)),
    metaDescription: strOrNull(fd.get(`${locale}_meta_description`)),
    ogTitle: strOrNull(fd.get(`${locale}_og_title`)),
    ogDescription: strOrNull(fd.get(`${locale}_og_description`)),
  };
}

export function parseUpdatePageFormData(
  fd: FormData,
  pageId: number
): UpdatePageInput {
  return {
    pageId,
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}
