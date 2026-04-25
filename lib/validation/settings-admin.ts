import { z } from "zod";

const navTranslationSchema = z.object({
  label: z.string().min(1).max(200),
});

export const navItemSchema = z
  .object({
    menu: z.enum(["header", "footer"]),
    displayOrder: z.number().int().min(0).default(0),
    linkKind: z.enum(["route", "external"]),
    routeKey: z.string().max(120).optional().nullable(),
    externalUrl: z.string().url().optional().nullable(),
    isVisible: z.boolean().default(true),
    bn: navTranslationSchema,
    en: navTranslationSchema,
    ar: navTranslationSchema,
  })
  .superRefine((v, ctx) => {
    if (v.linkKind === "route" && !v.routeKey) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["routeKey"], message: "Route key required for route links" });
    }
    if (v.linkKind === "external" && !v.externalUrl) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["externalUrl"], message: "External URL required for external links" });
    }
  });

export const createNavItemSchema = navItemSchema;
export const updateNavItemSchema = navItemSchema.extend({ itemId: z.number().int().positive() });
export const deleteNavItemSchema = z.object({ itemId: z.number().int().positive() });

export const siteSettingsSchema = z.object({
  contactEmail: z.string().email().optional().nullable(),
  contactPhone: z.string().max(100).optional().nullable(),
  address: z.string().max(2000).optional().nullable(),
  logoMediaId: z.number().int().positive().optional().nullable(),
  defaultOgImageId: z.number().int().positive().optional().nullable(),
  socials: z.array(z.object({ platform: z.string().min(1).max(100), url: z.string().url() })).default([]),
  bn: z.object({
    siteName: z.string().min(1).max(200),
    tagline: z.string().max(500).optional().nullable(),
    footerText: z.string().max(1000).optional().nullable(),
    defaultMetaDescription: z.string().max(300).optional().nullable(),
  }),
  en: z.object({
    siteName: z.string().min(1).max(200),
    tagline: z.string().max(500).optional().nullable(),
    footerText: z.string().max(1000).optional().nullable(),
    defaultMetaDescription: z.string().max(300).optional().nullable(),
  }),
  ar: z.object({
    siteName: z.string().min(1).max(200),
    tagline: z.string().max(500).optional().nullable(),
    footerText: z.string().max(1000).optional().nullable(),
    defaultMetaDescription: z.string().max(300).optional().nullable(),
  }),
});

function str(v: FormDataEntryValue | null): string {
  if (typeof v === "string") return v.trim();
  return "";
}
function strOrNull(v: FormDataEntryValue | null): string | null {
  const s = str(v);
  return s.length ? s : null;
}
function numOrNull(v: FormDataEntryValue | null): number | null {
  const s = str(v);
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
function bool(v: FormDataEntryValue | null): boolean {
  const s = str(v);
  return s === "true" || s === "1" || s === "on";
}
function parseNavTranslation(fd: FormData, locale: string) {
  return { label: str(fd.get(`${locale}_label`)) };
}
export function parseCreateNavItemFormData(fd: FormData) {
  return {
    menu: str(fd.get("menu")) as "header" | "footer",
    displayOrder: Number(str(fd.get("displayOrder")) || 0),
    linkKind: str(fd.get("linkKind")) as "route" | "external",
    routeKey: strOrNull(fd.get("routeKey")),
    externalUrl: strOrNull(fd.get("externalUrl")),
    isVisible: bool(fd.get("isVisible")),
    bn: parseNavTranslation(fd, "bn"),
    en: parseNavTranslation(fd, "en"),
    ar: parseNavTranslation(fd, "ar"),
  };
}
export function parseUpdateNavItemFormData(fd: FormData, itemId: number) {
  return { itemId, ...parseCreateNavItemFormData(fd) };
}

function parseSiteTranslation(fd: FormData, locale: string) {
  return {
    siteName: str(fd.get(`${locale}_site_name`)),
    tagline: strOrNull(fd.get(`${locale}_tagline`)),
    footerText: strOrNull(fd.get(`${locale}_footer_text`)),
    defaultMetaDescription: strOrNull(fd.get(`${locale}_default_meta_description`)),
  };
}

export function parseSiteSettingsFormData(fd: FormData) {
  const socialsRaw = str(fd.get("socials_json"));
  let socials: { platform: string; url: string }[] = [];
  if (socialsRaw) {
    try {
      socials = JSON.parse(socialsRaw);
    } catch {
      socials = [];
    }
  }
  return {
    contactEmail: strOrNull(fd.get("contactEmail")),
    contactPhone: strOrNull(fd.get("contactPhone")),
    address: strOrNull(fd.get("address")),
    logoMediaId: numOrNull(fd.get("logoMediaId")),
    defaultOgImageId: numOrNull(fd.get("defaultOgImageId")),
    socials,
    bn: parseSiteTranslation(fd, "bn"),
    en: parseSiteTranslation(fd, "en"),
    ar: parseSiteTranslation(fd, "ar"),
  };
}
