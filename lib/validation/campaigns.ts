/**
 * Zod schemas for Campaign admin mutations.
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

export const campaignTranslationSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  slug: slugSchema,
  excerpt: z.string().max(1000).optional().nullable(),
  body: z.string().min(1, "Body is required"),
  goals: z.string().max(5000).optional().nullable(),
  seoTitle: z.string().max(200).optional().nullable(),
  metaDescription: z.string().max(300).optional().nullable(),
  ogTitle: z.string().max(200).optional().nullable(),
  ogDescription: z.string().max(300).optional().nullable(),
});

export type CampaignTranslationInput = z.infer<typeof campaignTranslationSchema>;

const baseCampaignSchema = z.object({
  statusLifecycle: z.enum(["active", "past"]),
  startDate: z.string().optional().nullable(),
  endDate: z.string().optional().nullable(),
  bn: campaignTranslationSchema,
  en: campaignTranslationSchema,
  ar: campaignTranslationSchema,
});

export const createCampaignSchema = baseCampaignSchema;
export type CreateCampaignInput = z.infer<typeof createCampaignSchema>;

export const updateCampaignSchema = baseCampaignSchema.extend({
  campaignId: z.number().int().positive(),
});
export type UpdateCampaignInput = z.infer<typeof updateCampaignSchema>;

export const publishCampaignSchema = z.object({
  campaignId: z.number().int().positive(),
  locale: z.enum(["bn", "en", "ar"]),
});

export const deleteCampaignSchema = z.object({
  campaignId: z.number().int().positive(),
});

function str(v: FormDataEntryValue | null): string {
  if (typeof v === "string") return v.trim();
  return "";
}

function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s.length > 0 ? s : null;
}

function parseTranslation(fd: FormData, locale: string): CampaignTranslationInput {
  return {
    title: str(fd.get(`${locale}_title`)),
    slug: str(fd.get(`${locale}_slug`)),
    excerpt: strOrNull(fd.get(`${locale}_excerpt`)),
    body: str(fd.get(`${locale}_body`)),
    goals: strOrNull(fd.get(`${locale}_goals`)),
    seoTitle: strOrNull(fd.get(`${locale}_seo_title`)),
    metaDescription: strOrNull(fd.get(`${locale}_meta_description`)),
    ogTitle: strOrNull(fd.get(`${locale}_og_title`)),
    ogDescription: strOrNull(fd.get(`${locale}_og_description`)),
  };
}

function dateOrNull(v: FormDataEntryValue | null): string | null {
  const value = str(v);
  return value.length > 0 ? value : null;
}

export function parseCreateCampaignFormData(fd: FormData): CreateCampaignInput {
  return {
    statusLifecycle: str(fd.get("statusLifecycle")) as "active" | "past",
    startDate: dateOrNull(fd.get("startDate")),
    endDate: dateOrNull(fd.get("endDate")),
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}

export function parseUpdateCampaignFormData(
  fd: FormData,
  campaignId: number
): UpdateCampaignInput {
  return {
    campaignId,
    statusLifecycle: str(fd.get("statusLifecycle")) as "active" | "past",
    startDate: dateOrNull(fd.get("startDate")),
    endDate: dateOrNull(fd.get("endDate")),
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}
