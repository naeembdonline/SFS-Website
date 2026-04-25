"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import { isResourceSlugAvailable } from "@/lib/data/admin/resources";
import {
  createResourceSchema,
  updateResourceSchema,
  publishResourceSchema,
  deleteResourceSchema,
  parseCreateResourceFormData,
  parseUpdateResourceFormData,
  type ResourceTranslationInput,
} from "@/lib/validation/resources";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

function revalidateResourceTags() {
  revalidateTag("resources", "max");
  for (const locale of locales) {
    revalidateTag(`resources-${locale}`, "max");
  }
}

type TranslationMap = Record<Locale, ResourceTranslationInput>;

export async function createResourceAction(
  _prev: ActionState<{ id: number }>,
  formData: FormData
): Promise<ActionState<{ id: number }>> {
  return withAdmin(async (ctx) => {
    const raw = parseCreateResourceFormData(formData);
    const parsed = createResourceSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Validation failed", "VALIDATION_ERROR");
    }
    const input = parsed.data;
    const translations: TranslationMap = { bn: input.bn, en: input.en, ar: input.ar };

    for (const locale of locales) {
      const available = await isResourceSlugAvailable(locale, translations[locale].slug, null);
      if (!available) {
        throw new ActionError(`The slug "${translations[locale].slug}" is already in use for ${locale}.`, "SLUG_CONFLICT");
      }
    }

    let resourceId!: number;
    await db.transaction(async (tx) => {
      const [newResource] = await tx
        .insert(schema.resources)
        .values({
          kind: input.kind,
          fileMediaId: input.fileMediaId ?? null,
          externalUrl: input.externalUrl ?? null,
        })
        .returning({ id: schema.resources.id });

      resourceId = newResource.id;

      for (const locale of locales) {
        const t = translations[locale];
        await tx.insert(schema.resourceTranslations).values({
          resourceId,
          locale,
          title: t.title,
          slug: t.slug,
          description: t.description ?? null,
          seoTitle: t.seoTitle ?? null,
          metaDescription: t.metaDescription ?? null,
          ogTitle: t.ogTitle ?? null,
          ogDescription: t.ogDescription ?? null,
          status: "draft",
        });

        await tx.insert(schema.slugReservations).values({
          entityType: "resource",
          locale,
          slug: t.slug,
          entityId: resourceId,
        });
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "resource.create",
        entityType: "resource",
        entityId: resourceId,
        diff: { kind: input.kind, bn_title: input.bn.title, en_title: input.en.title, ar_title: input.ar.title },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateResourceTags();
    redirect(`/admin/resources/${resourceId}`);
  });
}

export async function updateResourceAction(
  resourceId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const raw = parseUpdateResourceFormData(formData, resourceId);
    const parsed = updateResourceSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Validation failed", "VALIDATION_ERROR");
    }
    const input = parsed.data;
    const translations: TranslationMap = { bn: input.bn, en: input.en, ar: input.ar };

    const existingTranslations = await db
      .select({
        id: schema.resourceTranslations.id,
        locale: schema.resourceTranslations.locale,
        slug: schema.resourceTranslations.slug,
        status: schema.resourceTranslations.status,
      })
      .from(schema.resourceTranslations)
      .where(eq(schema.resourceTranslations.resourceId, resourceId));

    const existingMap = new Map(existingTranslations.map((t) => [t.locale, t]));

    for (const locale of locales) {
      const existing = existingMap.get(locale);
      const newSlug = translations[locale].slug;
      if (existing && existing.slug === newSlug) continue;
      const available = await isResourceSlugAvailable(locale, newSlug, resourceId);
      if (!available) {
        throw new ActionError(`The slug "${newSlug}" is already in use for ${locale}.`, "SLUG_CONFLICT");
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.resources)
        .set({
          kind: input.kind,
          fileMediaId: input.fileMediaId ?? null,
          externalUrl: input.externalUrl ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.resources.id, resourceId));

      for (const locale of locales) {
        const t = translations[locale];
        const existing = existingMap.get(locale);

        if (existing) {
          await tx
            .update(schema.resourceTranslations)
            .set({
              title: t.title,
              slug: t.slug,
              description: t.description ?? null,
              seoTitle: t.seoTitle ?? null,
              metaDescription: t.metaDescription ?? null,
              ogTitle: t.ogTitle ?? null,
              ogDescription: t.ogDescription ?? null,
              updatedAt: new Date(),
            })
            .where(eq(schema.resourceTranslations.id, existing.id));

          if (existing.slug !== t.slug) {
            if (existing.status === "published") {
              await tx.insert(schema.slugRedirects).values({
                entityType: "resource",
                locale,
                oldSlug: existing.slug,
                entityId: resourceId,
                createdByUserId: ctx.user.id,
              });
            }
            await tx
              .update(schema.slugReservations)
              .set({ slug: t.slug })
              .where(
                and(
                  eq(schema.slugReservations.entityType, "resource"),
                  eq(schema.slugReservations.locale, locale),
                  eq(schema.slugReservations.entityId, resourceId)
                )
              );
          }
        } else {
          await tx.insert(schema.resourceTranslations).values({
            resourceId,
            locale,
            title: t.title,
            slug: t.slug,
            description: t.description ?? null,
            seoTitle: t.seoTitle ?? null,
            metaDescription: t.metaDescription ?? null,
            ogTitle: t.ogTitle ?? null,
            ogDescription: t.ogDescription ?? null,
            status: "draft",
          });
          await tx.insert(schema.slugReservations).values({
            entityType: "resource",
            locale,
            slug: t.slug,
            entityId: resourceId,
          });
        }
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "resource.update",
        entityType: "resource",
        entityId: resourceId,
        diff: { kind: input.kind },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateResourceTags();
  });
}

export async function publishResourceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishResourceSchema.safeParse({
      resourceId: Number(formData.get("resourceId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { resourceId, locale } = parsed.data;

    const [translation] = await db
      .select({
        id: schema.resourceTranslations.id,
        title: schema.resourceTranslations.title,
        metaDescription: schema.resourceTranslations.metaDescription,
        slug: schema.resourceTranslations.slug,
      })
      .from(schema.resourceTranslations)
      .where(
        and(
          eq(schema.resourceTranslations.resourceId, resourceId),
          eq(schema.resourceTranslations.locale, locale)
        )
      )
      .limit(1);
    if (!translation) throw new ActionError("Translation not found", "NOT_FOUND");
    if (!translation.title?.trim()) throw new ActionError("Title is required before publishing", "VALIDATION_ERROR");
    if (!translation.slug?.trim()) throw new ActionError("Slug is required before publishing", "VALIDATION_ERROR");
    if (!translation.metaDescription?.trim()) throw new ActionError("Meta description is required before publishing", "VALIDATION_ERROR");

    const now = new Date();
    await db.transaction(async (tx) => {
      const [updatedTranslation] = await tx
        .update(schema.resourceTranslations)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(schema.resourceTranslations.id, translation.id))
        .returning({ id: schema.resourceTranslations.id });

      if (!updatedTranslation) {
        throw new ActionError("Resource translation could not be published", "UPDATE_FAILED");
      }

      await tx
        .update(schema.resources)
        .set({ updatedAt: now })
        .where(eq(schema.resources.id, resourceId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "resource.publish",
        entityType: "resource",
        entityId: resourceId,
        localeAffected: locale,
        diff: { slug: translation.slug },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateResourceTags();
    revalidateTag(`resource-slug-${locale}-${translation.slug}`, "max");
    revalidatePath(`/admin/resources/${resourceId}`);
  });
}

export async function unpublishResourceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishResourceSchema.safeParse({
      resourceId: Number(formData.get("resourceId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { resourceId, locale } = parsed.data;

    const [translation] = await db
      .select({ id: schema.resourceTranslations.id, slug: schema.resourceTranslations.slug })
      .from(schema.resourceTranslations)
      .where(
        and(
          eq(schema.resourceTranslations.resourceId, resourceId),
          eq(schema.resourceTranslations.locale, locale)
        )
      )
      .limit(1);
    if (!translation) throw new ActionError("Translation not found", "NOT_FOUND");

    await db.transaction(async (tx) => {
      const [updatedTranslation] = await tx
        .update(schema.resourceTranslations)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(schema.resourceTranslations.id, translation.id))
        .returning({ id: schema.resourceTranslations.id });

      if (!updatedTranslation) {
        throw new ActionError("Resource translation could not be unpublished", "UPDATE_FAILED");
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "resource.unpublish",
        entityType: "resource",
        entityId: resourceId,
        localeAffected: locale,
        diff: { slug: translation.slug },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateResourceTags();
    revalidateTag(`resource-slug-${locale}-${translation.slug}`, "max");
    revalidatePath(`/admin/resources/${resourceId}`);
  });
}

export async function deleteResourceAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = deleteResourceSchema.safeParse({
      resourceId: Number(formData.get("resourceId")),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");

    const [resource] = await db
      .select({ id: schema.resources.id, deletedAt: schema.resources.deletedAt })
      .from(schema.resources)
      .where(eq(schema.resources.id, parsed.data.resourceId))
      .limit(1);
    if (!resource) throw new ActionError("Resource not found", "NOT_FOUND");
    if (resource.deletedAt) throw new ActionError("Resource is already deleted", "ALREADY_DELETED");

    await db.transaction(async (tx) => {
      await tx
        .update(schema.resources)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.resources.id, parsed.data.resourceId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "resource.delete",
        entityType: "resource",
        entityId: parsed.data.resourceId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateResourceTags();
    redirect("/admin/resources");
  });
}
