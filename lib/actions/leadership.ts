"use server";

import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  createLeadershipSchema,
  updateLeadershipSchema,
  deleteLeadershipSchema,
  toggleLeadershipVisibilitySchema,
  parseCreateLeadershipFormData,
  parseUpdateLeadershipFormData,
} from "@/lib/validation/leadership";
import { locales } from "@/lib/i18n/config";

function revalidateLeadershipTags() {
  revalidateTag("leadership", "max");
  for (const locale of locales) revalidateTag(`leadership-${locale}`, "max");
}

export async function createLeadershipAction(
  _prev: ActionState<{ id: number }>,
  formData: FormData
): Promise<ActionState<{ id: number }>> {
  return withAdmin(async (ctx) => {
    const parsed = createLeadershipSchema.safeParse(parseCreateLeadershipFormData(formData));
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION_ERROR");
    const input = parsed.data;

    let id!: number;
    await db.transaction(async (tx) => {
      const [member] = await tx
        .insert(schema.leadership)
        .values({
          photoMediaId: input.photoMediaId ?? null,
          displayOrder: input.displayOrder,
          isVisible: input.isVisible,
        })
        .returning({ id: schema.leadership.id });
      id = member.id;

      for (const locale of locales) {
        const t = input[locale];
        await tx.insert(schema.leadershipTranslations).values({
          leadershipId: id,
          locale,
          name: t.name,
          roleTitle: t.roleTitle ?? null,
          bio: t.bio ?? null,
        });
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "leadership.create",
        entityType: "leadership",
        entityId: id,
        diff: { bn_name: input.bn.name, order: input.displayOrder },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateLeadershipTags();
    redirect(`/admin/leadership/${id}`);
  });
}

export async function updateLeadershipAction(
  leadershipId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = updateLeadershipSchema.safeParse(parseUpdateLeadershipFormData(formData, leadershipId));
    if (!parsed.success) throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid input", "VALIDATION_ERROR");
    const input = parsed.data;

    await db.transaction(async (tx) => {
      const translationRows = await tx
        .select({ id: schema.leadershipTranslations.id, locale: schema.leadershipTranslations.locale })
        .from(schema.leadershipTranslations)
        .where(eq(schema.leadershipTranslations.leadershipId, leadershipId));

      await tx
        .update(schema.leadership)
        .set({
          photoMediaId: input.photoMediaId ?? null,
          displayOrder: input.displayOrder,
          isVisible: input.isVisible,
          updatedAt: new Date(),
        })
        .where(eq(schema.leadership.id, leadershipId));

      for (const locale of locales) {
        const t = input[locale];
        const row = translationRows.find((r) => r.locale === locale);
        if (row) {
          await tx
            .update(schema.leadershipTranslations)
            .set({ name: t.name, roleTitle: t.roleTitle ?? null, bio: t.bio ?? null, updatedAt: new Date() })
            .where(eq(schema.leadershipTranslations.id, row.id));
        } else {
          await tx.insert(schema.leadershipTranslations).values({
            leadershipId,
            locale,
            name: t.name,
            roleTitle: t.roleTitle ?? null,
            bio: t.bio ?? null,
          });
        }
      }

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "leadership.update",
        entityType: "leadership",
        entityId: leadershipId,
        diff: { order: input.displayOrder, isVisible: input.isVisible },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateLeadershipTags();
  });
}

export async function toggleLeadershipVisibilityAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = toggleLeadershipVisibilitySchema.safeParse({
      leadershipId: Number(formData.get("leadershipId")),
      isVisible: formData.get("isVisible") === "true",
    });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");
    const { leadershipId, isVisible } = parsed.data;

    await db.transaction(async (tx) => {
      await tx
        .update(schema.leadership)
        .set({ isVisible, updatedAt: new Date() })
        .where(eq(schema.leadership.id, leadershipId));
      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "leadership.visibility",
        entityType: "leadership",
        entityId: leadershipId,
        diff: { isVisible },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateLeadershipTags();
  });
}

export async function deleteLeadershipAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = deleteLeadershipSchema.safeParse({ leadershipId: Number(formData.get("leadershipId")) });
    if (!parsed.success) throw new ActionError("Invalid input", "VALIDATION_ERROR");

    await db.transaction(async (tx) => {
      await tx
        .update(schema.leadership)
        .set({ deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(schema.leadership.id, parsed.data.leadershipId));
      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "leadership.delete",
        entityType: "leadership",
        entityId: parsed.data.leadershipId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    revalidateLeadershipTags();
    redirect("/admin/leadership");
  });
}
