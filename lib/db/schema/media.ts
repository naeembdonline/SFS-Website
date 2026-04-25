import {
  pgTable,
  bigserial,
  bigint,
  text,
  integer,
  timestamp,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { localeEnum } from "./_enums";
import { users } from "./auth";

// ─── JSONB variant type ───────────────────────────────────────────────────────

import { jsonb } from "drizzle-orm/pg-core";

export type MediaVariant = {
  key: string;
  width: number;
  format: string;
  bytes: number;
};

// ─── media ────────────────────────────────────────────────────────────────────

export const media = pgTable(
  "media",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // R2 object key (UUID-based); unique across all uploads
    storageKey: text("storage_key").notNull().unique(),
    // 'public' = served via CDN; 'private' = signed URLs only
    bucket: text("bucket").notNull(),
    originalFilename: text("original_filename"),
    // Server-sniffed MIME type — never trust client-declared value
    mime: text("mime").notNull(),
    bytes: bigint("bytes", { mode: "number" }).notNull(),
    // null for non-images
    width: integer("width"),
    height: integer("height"),
    checksumSha256: text("checksum_sha256"),
    uploadedByUserId: bigint("uploaded_by_user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    // Processed image variants: [{ key, width, format, bytes }]
    variants: jsonb("variants").$type<MediaVariant[]>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("media_storage_key_idx").on(t.storageKey),
    index("media_uploader_idx").on(t.uploadedByUserId),
    index("media_mime_idx").on(t.mime),
  ]
);

// ─── media_translations (alt text + caption per locale) ───────────────────────

export const mediaTranslations = pgTable(
  "media_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    mediaId: bigint("media_id", { mode: "number" })
      .notNull()
      .references(() => media.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    altText: text("alt_text"),
    caption: text("caption"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One translation row per (media, locale)
    uniqueIndex("media_translations_media_locale_idx").on(t.mediaId, t.locale),
    index("media_translations_media_id_idx").on(t.mediaId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const mediaRelations = relations(media, ({ one, many }) => ({
  uploadedBy: one(users, {
    fields: [media.uploadedByUserId],
    references: [users.id],
  }),
  translations: many(mediaTranslations),
}));

export const mediaTranslationsRelations = relations(
  mediaTranslations,
  ({ one }) => ({
    media: one(media, {
      fields: [mediaTranslations.mediaId],
      references: [media.id],
    }),
  })
);
