"use server";

import { eq } from "drizzle-orm";
import { DeleteObjectCommand } from "@aws-sdk/client-s3";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { r2Client, r2Config } from "@/lib/media/r2";

export async function updateMediaTranslationsAction(
  mediaId: number,
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    await db.transaction(async (tx) => {
      const rows = await tx
        .select({ id: schema.mediaTranslations.id, locale: schema.mediaTranslations.locale })
        .from(schema.mediaTranslations)
        .where(eq(schema.mediaTranslations.mediaId, mediaId));
      for (const locale of ["bn", "en", "ar"] as const) {
        const altText = (formData.get(`${locale}_alt_text`) as string | null)?.trim() || null;
        const caption = (formData.get(`${locale}_caption`) as string | null)?.trim() || null;
        const existing = rows.find((r) => r.locale === locale);
        if (existing) {
          await tx
            .update(schema.mediaTranslations)
            .set({ altText, caption, updatedAt: new Date() })
            .where(eq(schema.mediaTranslations.id, existing.id));
        } else {
          await tx.insert(schema.mediaTranslations).values({ mediaId, locale, altText, caption });
        }
      }
      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "media.translations.update",
        entityType: "media",
        entityId: mediaId,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
  });
}

export async function deleteMediaAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    if (ctx.user.role !== "admin") throw new ActionError("Admin only", "FORBIDDEN");
    const mediaId = Number(formData.get("mediaId"));
    if (!Number.isFinite(mediaId) || mediaId <= 0) throw new ActionError("Invalid media ID", "VALIDATION_ERROR");

    const [media] = await db.select().from(schema.media).where(eq(schema.media.id, mediaId)).limit(1);
    if (!media) throw new ActionError("Media not found", "NOT_FOUND");

    const bucketName = media.bucket === "public" ? r2Config.bucketPublic : r2Config.bucketPrivate;
    await r2Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: media.storageKey }));
    for (const variant of media.variants ?? []) {
      await r2Client.send(new DeleteObjectCommand({ Bucket: r2Config.bucketPublic, Key: variant.key }));
    }

    await db.transaction(async (tx) => {
      await tx.delete(schema.media).where(eq(schema.media.id, mediaId));
      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "media.delete",
        entityType: "media",
        entityId: mediaId,
        diff: { storageKey: media.storageKey },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
  }, { role: "admin" });
}
