import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit";
import type { SniffedMime } from "@/lib/media/process";
import type { Locale } from "@/lib/i18n/config";

export interface AdminMediaItem {
  id: number;
  storageKey: string;
  bucket: string;
  originalFilename: string | null;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  createdAt: Date;
}

export interface AdminMediaDetail extends AdminMediaItem {
  translations: Record<Locale, { altText: string | null; caption: string | null }>;
}

export async function getAdminMediaList(limit = 100): Promise<AdminMediaItem[]> {
  try {
    const rows = await db
      .select()
      .from(schema.media)
      .orderBy(desc(schema.media.createdAt))
      .limit(limit);
    return rows.map((r) => ({
      id: r.id,
      storageKey: r.storageKey,
      bucket: r.bucket,
      originalFilename: r.originalFilename ?? null,
      mime: r.mime,
      bytes: r.bytes,
      width: r.width ?? null,
      height: r.height ?? null,
      createdAt: r.createdAt,
    }));
  } catch {
    return [];
  }
}

export async function getAdminMediaById(id: number): Promise<AdminMediaDetail | null> {
  try {
    const [media] = await db.select().from(schema.media).where(eq(schema.media.id, id)).limit(1);
    if (!media) return null;
    const tr = await db
      .select()
      .from(schema.mediaTranslations)
      .where(eq(schema.mediaTranslations.mediaId, id));
    const translations: AdminMediaDetail["translations"] = {
      bn: { altText: null, caption: null },
      en: { altText: null, caption: null },
      ar: { altText: null, caption: null },
    };
    for (const row of tr) translations[row.locale as Locale] = { altText: row.altText ?? null, caption: row.caption ?? null };
    return {
      id: media.id,
      storageKey: media.storageKey,
      bucket: media.bucket,
      originalFilename: media.originalFilename ?? null,
      mime: media.mime,
      bytes: media.bytes,
      width: media.width ?? null,
      height: media.height ?? null,
      createdAt: media.createdAt,
      translations,
    };
  } catch {
    return null;
  }
}

// ── commitMedia ──────────────────────────────────────────────────────────────

export interface CommitMediaInput {
  storageKey: string;
  bucket: "public" | "private";
  originalFilename: string | null;
  mime: SniffedMime;
  bytes: number;
  checksumSha256: string;
  uploadedByUserId: number;
  actorRole: string;
  requestId: string;
  ip: string | undefined;
  userAgent: string | undefined;
}

export interface CommittedMedia {
  id: number;
  storageKey: string;
  mime: string;
  bytes: number;
  width: null;
  height: null;
  variants: never[];
}

/**
 * Persists an already-uploaded R2 object to the media table.
 * Creates per-locale translation rows and writes an audit log entry —
 * all in a single transaction.
 */
export async function commitMedia(input: CommitMediaInput): Promise<CommittedMedia> {
  let mediaId = 0;

  await db.transaction(async (tx) => {
    const [media] = await tx
      .insert(schema.media)
      .values({
        storageKey: input.storageKey,
        bucket: input.bucket,
        originalFilename: input.originalFilename,
        mime: input.mime,
        bytes: input.bytes,
        width: null,
        height: null,
        checksumSha256: input.checksumSha256,
        uploadedByUserId: input.uploadedByUserId,
        variants: [],
      })
      .returning({ id: schema.media.id });
    mediaId = media.id;

    for (const locale of ["bn", "en", "ar"] as const) {
      await tx.insert(schema.mediaTranslations).values({
        mediaId,
        locale,
        altText: null,
        caption: null,
      });
    }

    await writeAuditLog(tx, {
      requestId: input.requestId,
      actorUserId: input.uploadedByUserId,
      actorRole: input.actorRole,
      action: "media.commit",
      entityType: "media",
      entityId: mediaId,
      diff: {
        storageKey: input.storageKey,
        mime: input.mime,
        bytes: input.bytes,
      },
      ip: input.ip,
      userAgent: input.userAgent,
    });
  });

  return {
    id: mediaId,
    storageKey: input.storageKey,
    mime: input.mime,
    bytes: input.bytes,
    width: null,
    height: null,
    variants: [],
  };
}
