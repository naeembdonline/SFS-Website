"use server";

import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import { locales } from "@/lib/i18n/config";
import {
  createNavItemSchema,
  updateNavItemSchema,
  deleteNavItemSchema,
  siteSettingsSchema,
  parseCreateNavItemFormData,
  parseUpdateNavItemFormData,
  parseSiteSettingsFormData,
} from "@/lib/validation/settings-admin";

function revalidateNavTags() {
  for (const menu of ["header", "footer"] as const) {
    revalidateTag(`nav-${menu}`, "max");
    for (const locale of locales) revalidateTag(`nav-${menu}-${locale}`, "max");
  }
}
function revalidateSiteTags() {
  revalidateTag("site-settings", "max");
  for (const locale of locales) revalidateTag(`site-settings-${locale}`, "max");
}

export async function createNavItemAction(
  _prev: ActionState<{ id: number }>,
  formData: FormData
): Promise<ActionState<{ id: number }>> {
  return withAdmin(async (ctx) => {
    if (ctx.user.role !== "admin") throw new ActionError("Admin only", "FORBIDDEN");
    const parsed = createNavItemSchema.safeParse(parseCreateNavItemFormData(formData));
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION_ERROR");
    const input = parsed.data;
    let id!: number;
    await db.transaction(async (tx) => {
      const [item] = await tx
        .insert(schema.navigationItems)
        .values({
          menu: input.menu,
          parentId: null,
          displayOrder: input.displayOrder,
          linkKind: input.linkKind,
          routeKey: input.linkKind === "route" ? input.routeKey ?? null : null,
          externalUrl: input.linkKind === "external" ? input.externalUrl ?? null : null,
          isVisible: input.isVisible,
        })
        .returning({ id: schema.navigationItems.id });
      id = item.id;

      for (const locale of locales) {
        await tx.insert(schema.navigationItemTranslations).values({
          navigationItemId: id,
          locale,
          label: input[locale].label,
        });
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "navigation.create",
        entityType: "navigation_item",
        entityId: id,
        diff: { menu: input.menu, linkKind: input.linkKind, parentId: null },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
    revalidateNavTags();
    return { id };
  }, { role: "admin" });
}

export async function updateNavItemAction(
  itemId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = updateNavItemSchema.safeParse(parseUpdateNavItemFormData(formData, itemId));
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION_ERROR");
    const input = parsed.data;
    await db.transaction(async (tx) => {
      await tx
        .update(schema.navigationItems)
        .set({
          menu: input.menu,
          parentId: null,
          displayOrder: input.displayOrder,
          linkKind: input.linkKind,
          routeKey: input.linkKind === "route" ? input.routeKey ?? null : null,
          externalUrl: input.linkKind === "external" ? input.externalUrl ?? null : null,
          isVisible: input.isVisible,
          updatedAt: new Date(),
        })
        .where(eq(schema.navigationItems.id, itemId));

      const translationRows = await tx
        .select({ id: schema.navigationItemTranslations.id, locale: schema.navigationItemTranslations.locale })
        .from(schema.navigationItemTranslations)
        .where(eq(schema.navigationItemTranslations.navigationItemId, itemId));

      for (const locale of locales) {
        const existing = translationRows.find((r) => r.locale === locale);
        if (existing) {
          await tx
            .update(schema.navigationItemTranslations)
            .set({ label: input[locale].label, updatedAt: new Date() })
            .where(eq(schema.navigationItemTranslations.id, existing.id));
        } else {
          await tx.insert(schema.navigationItemTranslations).values({
            navigationItemId: itemId,
            locale,
            label: input[locale].label,
          });
        }
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "navigation.update",
        entityType: "navigation_item",
        entityId: itemId,
        diff: { menu: input.menu, linkKind: input.linkKind, parentId: null },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
    revalidateNavTags();
  }, { role: "admin" });
}

export async function deleteNavItemAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = deleteNavItemSchema.safeParse({ itemId: Number(formData.get("itemId")) });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    await db.transaction(async (tx) => {
      await tx.delete(schema.navigationItems).where(eq(schema.navigationItems.id, parsed.data.itemId));
      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "navigation.delete",
        entityType: "navigation_item",
        entityId: parsed.data.itemId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
    revalidateNavTags();
  }, { role: "admin" });
}

export async function updateSiteSettingsAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = siteSettingsSchema.safeParse(parseSiteSettingsFormData(formData));
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION_ERROR");
    const input = parsed.data;
    await db.transaction(async (tx) => {
      await tx
        .update(schema.siteSettings)
        .set({
          contactEmail: input.contactEmail ?? null,
          contactPhone: input.contactPhone ?? null,
          address: input.address ?? null,
          logoMediaId: input.logoMediaId ?? null,
          defaultOgImageId: input.defaultOgImageId ?? null,
          socials: input.socials,
          updatedAt: new Date(),
        })
        .where(eq(schema.siteSettings.id, 1));

      const existing = await tx.select().from(schema.siteSettingsTranslations);
      for (const locale of locales) {
        const t = input[locale];
        const row = existing.find((e) => e.locale === locale);
        if (row) {
          await tx
            .update(schema.siteSettingsTranslations)
            .set({
              siteName: t.siteName,
              tagline: t.tagline ?? null,
              footerText: t.footerText ?? null,
              defaultMetaDescription: t.defaultMetaDescription ?? null,
              updatedAt: new Date(),
            })
            .where(eq(schema.siteSettingsTranslations.id, row.id));
        } else {
          await tx.insert(schema.siteSettingsTranslations).values({
            locale,
            siteName: t.siteName,
            tagline: t.tagline ?? null,
            footerText: t.footerText ?? null,
            defaultMetaDescription: t.defaultMetaDescription ?? null,
          });
        }
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "site_settings.update",
        entityType: "site_settings",
        entityId: 1,
        diff: { contactEmail: input.contactEmail },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
    revalidateSiteTags();
    revalidateNavTags();
  }, { role: "admin" });
}
