/**
 * Zod schemas for Resource admin mutations.
 */

import { z } from "zod";

const RESERVED_SLUGS = new Set([
  "admin", "api", "_next", "static", "public", "assets", "media", "uploads",
  "auth", "login", "logout", "robots.txt", "sitemap.xml", "favicon.ico",
  "manifest.json", "health", "og", "rss", "feed", "bn", "en", "ar",
  "new", "edit", "draft", "preview", "page", "tag", "category",
  "archive", "search",
]);

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

export const resourceTranslationSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: slugSchema,
  description: z.string().max(5000).optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(300).optional().nullable(),
});

export type ResourceTranslationInput = z.infer<typeof resourceTranslationSchema>;

const baseResourceSchema = z
  .object({
    kind: z.enum(["pdf", "link", "doc"]),
    fileMediaId: z.number().int().positive().optional().nullable(),
    externalUrl: z.string().url("External URL must be valid").optional().nullable(),
    bn: resourceTranslationSchema,
    en: resourceTranslationSchema,
    ar: resourceTranslationSchema,
  })
  .superRefine((val, ctx) => {
    if (val.kind === "link" && !val.externalUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "External URL is required for link resources",
        path: ["externalUrl"],
      });
    }
    if ((val.kind === "pdf" || val.kind === "doc") && !val.fileMediaId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "File media ID is required for pdf/doc resources",
        path: ["fileMediaId"],
      });
    }
  });

export const createResourceSchema = baseResourceSchema;
export type CreateResourceInput = z.infer<typeof createResourceSchema>;

export const updateResourceSchema = baseResourceSchema.extend({
  resourceId: z.number().int().positive(),
});
export type UpdateResourceInput = z.infer<typeof updateResourceSchema>;

export const publishResourceSchema = z.object({
  resourceId: z.number().int().positive(),
  locale: z.enum(["bn", "en", "ar"]),
});

export const deleteResourceSchema = z.object({
  resourceId: z.number().int().positive(),
});

function str(v: FormDataEntryValue | null): string {
  if (typeof v === "string") return v.trim();
  return "";
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s.length > 0 ? s : null;
}

function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseTranslation(fd: FormData, locale: string): ResourceTranslationInput {
  return {
    title: str(fd.get(`${locale}_title`)),
    slug: str(fd.get(`${locale}_slug`)),
    description: strOrNull(fd.get(`${locale}_description`)),
    seoTitle: strOrNull(fd.get(`${locale}_seo_title`)),
    metaDescription: strOrNull(fd.get(`${locale}_meta_description`)),
    ogTitle: strOrNull(fd.get(`${locale}_og_title`)),
    ogDescription: strOrNull(fd.get(`${locale}_og_description`)),
  };
}

export function parseCreateResourceFormData(fd: FormData): CreateResourceInput {
  return {
    kind: str(fd.get("kind")) as "pdf" | "link" | "doc",
    fileMediaId: numOrNull(fd.get("fileMediaId")),
    externalUrl: strOrNull(fd.get("externalUrl")),
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}

export function parseUpdateResourceFormData(
  fd: FormData,
  resourceId: number
): UpdateResourceInput {
  return {
    resourceId,
    kind: str(fd.get("kind")) as "pdf" | "link" | "doc",
    fileMediaId: numOrNull(fd.get("fileMediaId")),
    externalUrl: strOrNull(fd.get("externalUrl")),
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}
