"use server";

import { redirect } from "next/navigation";
import { revalidatePath, revalidateTag } from "next/cache";
import { eq, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import { isCampaignSlugAvailable } from "@/lib/data/admin/campaigns";
import {
  createCampaignSchema,
  updateCampaignSchema,
  publishCampaignSchema,
  deleteCampaignSchema,
  parseCreateCampaignFormData,
  parseUpdateCampaignFormData,
  type CampaignTranslationInput,
} from "@/lib/validation/campaigns";
import type { Locale } from "@/lib/i18n/config";
import { locales } from "@/lib/i18n/config";

function revalidateCampaignTags() {
  revalidateTag("campaigns", "max");
  for (const locale of locales) {
    revalidateTag(`campaigns-${locale}`, "max");
  }
}

type TranslationMap = Record<Locale, CampaignTranslationInput>;

export async function createCampaignAction(
  _prev: ActionState<{ id: number }>,
  formData: FormData
): Promise<ActionState<{ id: number }>> {
  return withAdmin(async (ctx) => {
    const raw = parseCreateCampaignFormData(formData);
    const parsed = createCampaignSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Validation failed", "VALIDATION_ERROR");
    }
    const input = parsed.data;
    const translations: TranslationMap = { bn: input.bn, en: input.en, ar: input.ar };

    for (const locale of locales) {
      const available = await isCampaignSlugAvailable(locale, translations[locale].slug, null);
      if (!available) {
        throw new ActionError(`The slug "${translations[locale].slug}" is already in use for ${locale}.`, "SLUG_CONFLICT");
      }
    }

    let campaignId!: number;
    await db.transaction(async (tx) => {
      const [newCampaign] = await tx
        .insert(schema.campaigns)
        .values({
          statusLifecycle: input.statusLifecycle,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
        })
        .returning({ id: schema.campaigns.id });

      campaignId = newCampaign.id;

      for (const locale of locales) {
        const t = translations[locale];
        await tx.insert(schema.campaignTranslations).values({
          campaignId,
          locale,
          title: t.title,
          slug: t.slug,
          excerpt: t.excerpt ?? null,
          body: t.body,
          goals: t.goals ?? null,
          seoTitle: t.seoTitle ?? null,
          metaDescription: t.metaDescription ?? null,
          ogTitle: t.ogTitle ?? null,
          ogDescription: t.ogDescription ?? null,
          status: "draft",
        });

        await tx.insert(schema.slugReservations).values({
          entityType: "campaign",
          locale,
          slug: t.slug,
          entityId: campaignId,
        });
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "campaign.create",
        entityType: "campaign",
        entityId: campaignId,
        diff: { bn_title: input.bn.title, en_title: input.en.title, ar_title: input.ar.title },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateCampaignTags();
    redirect(`/admin/campaigns/${campaignId}`);
  });
}

export async function updateCampaignAction(
  campaignId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const raw = parseUpdateCampaignFormData(formData, campaignId);
    const parsed = updateCampaignSchema.safeParse(raw);
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Validation failed", "VALIDATION_ERROR");
    }
    const input = parsed.data;
    const translations: TranslationMap = { bn: input.bn, en: input.en, ar: input.ar };

    const existingTranslations = await db
      .select({
        id: schema.campaignTranslations.id,
        locale: schema.campaignTranslations.locale,
        slug: schema.campaignTranslations.slug,
        status: schema.campaignTranslations.status,
      })
      .from(schema.campaignTranslations)
      .where(eq(schema.campaignTranslations.campaignId, campaignId));

    const existingMap = new Map(existingTranslations.map((t) => [t.locale, t]));

    for (const locale of locales) {
      const existing = existingMap.get(locale);
      const newSlug = translations[locale].slug;
      if (existing && existing.slug === newSlug) continue;
      const available = await isCampaignSlugAvailable(locale, newSlug, campaignId);
      if (!available) {
        throw new ActionError(`The slug "${newSlug}" is already in use for ${locale}.`, "SLUG_CONFLICT");
      }
    }

    await db.transaction(async (tx) => {
      await tx
        .update(schema.campaigns)
        .set({
          statusLifecycle: input.statusLifecycle,
          startDate: input.startDate ?? null,
          endDate: input.endDate ?? null,
          updatedAt: new Date(),
        })
        .where(eq(schema.campaigns.id, campaignId));

      for (const locale of locales) {
        const t = translations[locale];
        const existing = existingMap.get(locale);

        if (existing) {
          await tx
            .update(schema.campaignTranslations)
            .set({
              title: t.title,
              slug: t.slug,
              excerpt: t.excerpt ?? null,
              body: t.body,
              goals: t.goals ?? null,
              seoTitle: t.seoTitle ?? null,
              metaDescription: t.metaDescription ?? null,
              ogTitle: t.ogTitle ?? null,
              ogDescription: t.ogDescription ?? null,
              updatedAt: new Date(),
            })
            .where(eq(schema.campaignTranslations.id, existing.id));

          if (existing.slug !== t.slug) {
            if (existing.status === "published") {
              await tx.insert(schema.slugRedirects).values({
                entityType: "campaign",
                locale,
                oldSlug: existing.slug,
                entityId: campaignId,
                createdByUserId: ctx.user.id,
              });
            }
            await tx
              .update(schema.slugReservations)
              .set({ slug: t.slug })
              .where(
                and(
                  eq(schema.slugReservations.entityType, "campaign"),
                  eq(schema.slugReservations.locale, locale),
                  eq(schema.slugReservations.entityId, campaignId)
                )
              );
          }
        } else {
          await tx.insert(schema.campaignTranslations).values({
            campaignId,
            locale,
            title: t.title,
            slug: t.slug,
            excerpt: t.excerpt ?? null,
            body: t.body,
            goals: t.goals ?? null,
            seoTitle: t.seoTitle ?? null,
            metaDescription: t.metaDescription ?? null,
            ogTitle: t.ogTitle ?? null,
            ogDescription: t.ogDescription ?? null,
            status: "draft",
          });
          await tx.insert(schema.slugReservations).values({
            entityType: "campaign",
            locale,
            slug: t.slug,
            entityId: campaignId,
          });
        }
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "campaign.update",
        entityType: "campaign",
        entityId: campaignId,
        diff: { lifecycle: input.statusLifecycle },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateCampaignTags();
  });
}

export async function publishCampaignAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishCampaignSchema.safeParse({
      campaignId: Number(formData.get("campaignId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { campaignId, locale } = parsed.data;

    const [translation] = await db
      .select({
        id: schema.campaignTranslations.id,
        title: schema.campaignTranslations.title,
        body: schema.campaignTranslations.body,
        metaDescription: schema.campaignTranslations.metaDescription,
        slug: schema.campaignTranslations.slug,
      })
      .from(schema.campaignTranslations)
      .where(
        and(
          eq(schema.campaignTranslations.campaignId, campaignId),
          eq(schema.campaignTranslations.locale, locale)
        )
      )
      .limit(1);

    if (!translation) throw new ActionError("Translation not found", "NOT_FOUND");
    if (!translation.title?.trim()) throw new ActionError("Title is required before publishing", "VALIDATION_ERROR");
    if (!translation.body?.trim()) throw new ActionError("Body is required before publishing", "VALIDATION_ERROR");
    if (!translation.slug?.trim()) throw new ActionError("Slug is required before publishing", "VALIDATION_ERROR");
    if (!translation.metaDescription?.trim()) throw new ActionError("Meta description is required before publishing", "VALIDATION_ERROR");

    const [campaign] = await db
      .select({ firstPublishedAt: schema.campaigns.firstPublishedAt })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, campaignId))
      .limit(1);
    if (!campaign) throw new ActionError("Campaign not found", "NOT_FOUND");

    const now = new Date();
    await db.transaction(async (tx) => {
      const [updatedTranslation] = await tx
        .update(schema.campaignTranslations)
        .set({ status: "published", publishedAt: now, updatedAt: now })
        .where(eq(schema.campaignTranslations.id, translation.id))
        .returning({ id: schema.campaignTranslations.id });

      if (!updatedTranslation) {
        throw new ActionError("Campaign translation could not be published", "UPDATE_FAILED");
      }

      if (!campaign.firstPublishedAt) {
        await tx
          .update(schema.campaigns)
          .set({ firstPublishedAt: now, updatedAt: now })
          .where(eq(schema.campaigns.id, campaignId));
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "campaign.publish",
        entityType: "campaign",
        entityId: campaignId,
        localeAffected: locale,
        diff: { slug: translation.slug },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateCampaignTags();
    revalidateTag(`campaign-slug-${locale}-${translation.slug}`, "max");
    revalidatePath(`/admin/campaigns/${campaignId}`);
  });
}

export async function unpublishCampaignAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = publishCampaignSchema.safeParse({
      campaignId: Number(formData.get("campaignId")),
      locale: formData.get("locale"),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { campaignId, locale } = parsed.data;

    const [translation] = await db
      .select({ id: schema.campaignTranslations.id, slug: schema.campaignTranslations.slug })
      .from(schema.campaignTranslations)
      .where(
        and(
          eq(schema.campaignTranslations.campaignId, campaignId),
          eq(schema.campaignTranslations.locale, locale)
        )
      )
      .limit(1);
    if (!translation) throw new ActionError("Translation not found", "NOT_FOUND");

    await db.transaction(async (tx) => {
      const [updatedTranslation] = await tx
        .update(schema.campaignTranslations)
        .set({ status: "draft", updatedAt: new Date() })
        .where(eq(schema.campaignTranslations.id, translation.id))
        .returning({ id: schema.campaignTranslations.id });

      if (!updatedTranslation) {
        throw new ActionError("Campaign translation could not be unpublished", "UPDATE_FAILED");
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "campaign.unpublish",
        entityType: "campaign",
        entityId: campaignId,
        localeAffected: locale,
        diff: { slug: translation.slug },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateCampaignTags();
    revalidateTag(`campaign-slug-${locale}-${translation.slug}`, "max");
    revalidatePath(`/admin/campaigns/${campaignId}`);
  });
}

export async function deleteCampaignAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = deleteCampaignSchema.safeParse({
      campaignId: Number(formData.get("campaignId")),
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");

    const [campaign] = await db
      .select({ id: schema.campaigns.id, deletedAt: schema.campaigns.deletedAt })
      .from(schema.campaigns)
      .where(eq(schema.campaigns.id, parsed.data.campaignId))
      .limit(1);
    if (!campaign) throw new ActionError("Campaign not found", "NOT_FOUND");
    if (campaign.deletedAt) throw new ActionError("Campaign is already deleted", "ALREADY_DELETED");

    await db.transaction(async (tx) => {
      await tx
        .update(schema.campaigns)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.campaigns.id, parsed.data.campaignId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "campaign.delete",
        entityType: "campaign",
        entityId: parsed.data.campaignId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateCampaignTags();
    redirect("/admin/campaigns");
  });
}
