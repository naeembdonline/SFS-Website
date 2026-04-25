"use server";

import { revalidateTag } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  updatePageSchema,
  publishPageSchema,
  parseUpdatePageFormData,
  type PageTranslationInput,
} from "@/lib/validation/pages";
import { locales, type Locale } from "@/lib/i18n/config";
import type { PageSection } from "@/lib/db/schema/content";

// ─── Cache helpers ────────────────────────────────────────────────────────────

function revalidatePageTags(key: string) {
  revalidateTag(`page-${key}`, "max");
  for (const locale of locales) {
    revalidateTag(`page-${key}-${locale}`, "max");
  }
}

// ─── JSON sections helper ─────────────────────────────────────────────────────

function parseSectionsJson(
  raw: string | null | undefined
): { sections: PageSection[] | null; error: string | null } {
  if (!raw || raw.trim() === "") return { sections: null, error: null };
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return { sections: null, error: "Sections must be a JSON array." };
    }
    return { sections: parsed as PageSection[], error: null };
  } catch {
    return { sections: null, error: "Sections contains invalid JSON." };
  }
}

// ─── updatePageAction ─────────────────────────────────────────────────────────

export async function updatePageAction(
  pageId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const raw = parseUpdatePageFormData(formData, pageId);
    const parsed = updatePageSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(
        parsed.error.issues[0]?.message ?? "Validation failed",
        "VALIDATION_ERROR"
      );
    }
    const input = parsed.data;

    // Validate sections JSON for each locale before touching the DB
    const sectionsByLocale: Record<Locale, PageSection[] | null> = {
      bn: null,
      en: null,
      ar: null,
    };
    for (const locale of locales) {
      const t = input[locale] as PageTranslationInput;
      const { sections, error } = parseSectionsJson(t.sectionsJson);
      if (error) {
        throw new ActionError(`[${locale.toUpperCase()}] ${error}`, "INVALID_JSON");
      }
      sectionsByLocale[locale] = sections;
    }

    // Load the page to get its key (for cache invalidation)
    const [page] = await db
      .select({ key: schema.pages.key })
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);
    if (!page) throw new ActionError("Page not found", "NOT_FOUND");

    // Load existing translations
    const existingRows = await db
      .select({ id: schema.pageTranslations.id, locale: schema.pageTranslations.locale })
      .from(schema.pageTranslations)
      .where(eq(schema.pageTranslations.pageId, pageId));
    const existingMap = new Map(existingRows.map((r) => [r.locale, r.id]));

    await db.transaction(async (tx) => {
      for (const locale of locales) {
        const t = input[locale] as PageTranslationInput;
        const existingId = existingMap.get(locale);
        const sections = sectionsByLocale[locale];
        const slugVal = t.slug && t.slug.trim() !== "" ? t.slug.trim() : null;

        if (existingId) {
          await tx
            .update(schema.pageTranslations)
            .set({
              title: t.title,
              slug: slugVal,
              body: t.body ?? null,
              sections: sections ?? null,
              seoTitle: t.seoTitle ?? null,
              metaDescription: t.metaDescription ?? null,
              ogTitle: t.ogTitle ?? null,
              ogDescription: t.ogDescription ?? null,
              updatedAt: new Date(),
            })
            .where(eq(schema.pageTranslations.id, existingId));
        } else {
          await tx.insert(schema.pageTranslations).values({
            pageId,
            locale,
            title: t.title,
            slug: slugVal,
            body: t.body ?? null,
            sections: sections ?? null,
            seoTitle: t.seoTitle ?? null,
            metaDescription: t.metaDescription ?? null,
            ogTitle: t.ogTitle ?? null,
            ogDescription: t.ogDescription ?? null,
            status: "draft",
          });
        }
      }

      await tx
        .update(schema.pages)
        .set({ updatedAt: new Date() })
        .where(eq(schema.pages.id, pageId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "page.update",
        entityType: "page",
        entityId: pageId,
        diff: {
          key: page.key,
          bn_title: input.bn.title,
          en_title: input.en.title,
          ar_title: input.ar.title,
        },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePageTags(page.key);
  });
}

// ─── publishPageAction ────────────────────────────────────────────────────────

export async function publishPageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishPageSchema.safeParse({
      pageId: Number(formData.get("pageId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { pageId, locale } = parsed.data;

    const [translation] = await db
      .select({
        id: schema.pageTranslations.id,
        title: schema.pageTranslations.title,
      })
      .from(schema.pageTranslations)
      .where(
        and(
          eq(schema.pageTranslations.pageId, pageId),
          eq(schema.pageTranslations.locale, locale)
        )
      )
      .limit(1);

    if (!translation) throw new ActionError("Translation not found", "NOT_FOUND");
    if (!translation.title?.trim())
      throw new ActionError("Title is required before publishing", "VALIDATION_ERROR");

    const [page] = await db
      .select({ key: schema.pages.key })
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);
    if (!page) throw new ActionError("Page not found", "NOT_FOUND");

    const now = new Date();
    await db.transaction(async (tx) => {
      await tx
        .update(schema.pageTranslations)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(schema.pageTranslations.id, translation.id));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "page.publish",
        entityType: "page",
        entityId: pageId,
        localeAffected: locale,
        diff: { key: page.key },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePageTags(page.key);
  });
}

// ─── unpublishPageAction ──────────────────────────────────────────────────────

export async function unpublishPageAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishPageSchema.safeParse({
      pageId: Number(formData.get("pageId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { pageId, locale } = parsed.data;

    const [translation] = await db
      .select({ id: schema.pageTranslations.id })
      .from(schema.pageTranslations)
      .where(
        and(
          eq(schema.pageTranslations.pageId, pageId),
          eq(schema.pageTranslations.locale, locale)
        )
      )
      .limit(1);
    if (!translation) throw new ActionError("Translation not found", "NOT_FOUND");

    const [page] = await db
      .select({ key: schema.pages.key })
      .from(schema.pages)
      .where(eq(schema.pages.id, pageId))
      .limit(1);
    if (!page) throw new ActionError("Page not found", "NOT_FOUND");

    await db.transaction(async (tx) => {
      await tx
        .update(schema.pageTranslations)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(schema.pageTranslations.id, translation.id));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "page.unpublish",
        entityType: "page",
        entityId: pageId,
        localeAffected: locale,
        diff: { key: page.key },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidatePageTags(page.key);
  });
}
