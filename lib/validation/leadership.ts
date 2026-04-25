import { z } from "zod";

export const leadershipTranslationSchema = z.object({
  name: z.string().min(1, "Name is required").max(300),
  roleTitle: z.string().max(300).optional().nullable(),
  bio: z.string().max(10000).optional().nullable(),
});

const baseLeadershipSchema = z.object({
  photoMediaId: z.number().int().positive().optional().nullable(),
  displayOrder: z.number().int().min(0).default(0),
  isVisible: z.boolean().default(true),
  bn: leadershipTranslationSchema,
  en: leadershipTranslationSchema,
  ar: leadershipTranslationSchema,
});

export const createLeadershipSchema = baseLeadershipSchema;
export const updateLeadershipSchema = baseLeadershipSchema.extend({
  leadershipId: z.number().int().positive(),
});

export const deleteLeadershipSchema = z.object({
  leadershipId: z.number().int().positive(),
});

export const toggleLeadershipVisibilitySchema = z.object({
  leadershipId: z.number().int().positive(),
  isVisible: z.boolean(),
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
function parseTranslation(fd: FormData, locale: string) {
  return {
    name: str(fd.get(`${locale}_name`)),
    roleTitle: strOrNull(fd.get(`${locale}_role_title`)),
    bio: strOrNull(fd.get(`${locale}_bio`)),
  };
}

export function parseCreateLeadershipFormData(fd: FormData) {
  return {
    photoMediaId: numOrNull(fd.get("photoMediaId")),
    displayOrder: Number(str(fd.get("displayOrder")) || 0),
    isVisible: bool(fd.get("isVisible")),
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}

export function parseUpdateLeadershipFormData(fd: FormData, leadershipId: number) {
  return {
    leadershipId,
    photoMediaId: numOrNull(fd.get("photoMediaId")),
    displayOrder: Number(str(fd.get("displayOrder")) || 0),
    isVisible: bool(fd.get("isVisible")),
    bn: parseTranslation(fd, "bn"),
    en: parseTranslation(fd, "en"),
    ar: parseTranslation(fd, "ar"),
  };
}
