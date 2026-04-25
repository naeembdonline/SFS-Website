import {
  pgTable,
  bigserial,
  bigint,
  text,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  localeEnum,
  contentStatusEnum,
  postTypeEnum,
  resourceKindEnum,
  campaignLifecycleEnum,
} from "./_enums";
import { users } from "./auth";
import { media } from "./media";

// ─── Shared translation fields type ──────────────────────────────────────────
// Used as documentation reference; each table defines its own columns.

// ─── posts ────────────────────────────────────────────────────────────────────

export const posts = pgTable(
  "posts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    type: postTypeEnum("type").notNull(),
    coverMediaId: bigint("cover_media_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    authorUserId: bigint("author_user_id", { mode: "number" }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    // Set to the first published_at across all locales; used for list ordering
    firstPublishedAt: timestamp("first_published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("posts_type_idx").on(t.type),
    index("posts_first_published_at_idx").on(t.firstPublishedAt),
    // Partial index for active (non-deleted) posts
    index("posts_active_idx").on(t.deletedAt),
  ]
);

export const postTranslations = pgTable(
  "post_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    postId: bigint("post_id", { mode: "number" })
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    // Sanitized HTML from constrained rich-text editor
    body: text("body").notNull(),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImageId: bigint("og_image_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One translation row per (post, locale)
    uniqueIndex("post_translations_post_locale_idx").on(t.postId, t.locale),
    // Public list query: locale + status + date
    index("post_translations_locale_status_date_idx").on(
      t.locale,
      t.status,
      t.publishedAt
    ),
    index("post_translations_post_id_idx").on(t.postId),
    // Slug lookups (uniqueness enforced via slug_reservations)
    index("post_translations_locale_slug_idx").on(t.locale, t.slug),
  ]
);

// ─── pages ────────────────────────────────────────────────────────────────────

export type PageSection = Record<string, unknown>;

export const pages = pgTable(
  "pages",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // Stable identifier: 'home', 'about', 'contact', 'privacy', 'terms'
    key: text("key").notNull().unique(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("pages_key_idx").on(t.key),
  ]
);

export const pageTranslations = pgTable(
  "page_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    pageId: bigint("page_id", { mode: "number" })
      .notNull()
      .references(() => pages.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    // Nullable: keyed pages (home, contact) use fixed routes, not slug-based
    slug: text("slug"),
    body: text("body"),
    // Flexible block layout for home/about — schema validated in app layer
    sections: jsonb("sections").$type<PageSection[]>(),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImageId: bigint("og_image_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("page_translations_page_locale_idx").on(t.pageId, t.locale),
    index("page_translations_locale_status_idx").on(t.locale, t.status),
    index("page_translations_locale_slug_idx").on(t.locale, t.slug),
    index("page_translations_page_id_idx").on(t.pageId),
  ]
);

// ─── campaigns ────────────────────────────────────────────────────────────────

export const campaigns = pgTable(
  "campaigns",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // Campaign lifecycle (distinct from translation publish status)
    statusLifecycle: campaignLifecycleEnum("status_lifecycle")
      .notNull()
      .default("active"),
    coverMediaId: bigint("cover_media_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    startDate: date("start_date"),
    endDate: date("end_date"),
    firstPublishedAt: timestamp("first_published_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("campaigns_lifecycle_idx").on(t.statusLifecycle),
    index("campaigns_active_idx").on(t.deletedAt),
    index("campaigns_first_published_at_idx").on(t.firstPublishedAt),
  ]
);

export const campaignTranslations = pgTable(
  "campaign_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    campaignId: bigint("campaign_id", { mode: "number" })
      .notNull()
      .references(() => campaigns.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    excerpt: text("excerpt"),
    body: text("body").notNull(),
    goals: text("goals"),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImageId: bigint("og_image_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("campaign_translations_campaign_locale_idx").on(
      t.campaignId,
      t.locale
    ),
    index("campaign_translations_locale_status_date_idx").on(
      t.locale,
      t.status,
      t.publishedAt
    ),
    index("campaign_translations_locale_slug_idx").on(t.locale, t.slug),
    index("campaign_translations_campaign_id_idx").on(t.campaignId),
  ]
);

// ─── resources ────────────────────────────────────────────────────────────────

export const resources = pgTable(
  "resources",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    kind: resourceKindEnum("kind").notNull(),
    // For kind='pdf' or 'doc'
    fileMediaId: bigint("file_media_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    // For kind='link' — validated URL
    externalUrl: text("external_url"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // DB-level check: link has url, pdf/doc has fileMediaId
    // Enforced in app validation layer (Zod); add as DB constraint in migration
  },
  (t) => [
    index("resources_kind_idx").on(t.kind),
    index("resources_active_idx").on(t.deletedAt),
  ]
);

export const resourceTranslations = pgTable(
  "resource_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    resourceId: bigint("resource_id", { mode: "number" })
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    seoTitle: text("seo_title"),
    metaDescription: text("meta_description"),
    ogTitle: text("og_title"),
    ogDescription: text("og_description"),
    ogImageId: bigint("og_image_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    status: contentStatusEnum("status").notNull().default("draft"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("resource_translations_resource_locale_idx").on(
      t.resourceId,
      t.locale
    ),
    index("resource_translations_locale_status_date_idx").on(
      t.locale,
      t.status,
      t.publishedAt
    ),
    index("resource_translations_locale_slug_idx").on(t.locale, t.slug),
    index("resource_translations_resource_id_idx").on(t.resourceId),
  ]
);

// ─── leadership ───────────────────────────────────────────────────────────────

export const leadership = pgTable(
  "leadership",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    photoMediaId: bigint("photo_media_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    displayOrder: bigint("display_order", { mode: "number" })
      .notNull()
      .default(0),
    isVisible: boolean("is_visible").notNull().default(true),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("leadership_order_idx").on(t.displayOrder),
    index("leadership_visible_idx").on(t.isVisible),
    index("leadership_active_idx").on(t.deletedAt),
  ]
);

export const leadershipTranslations = pgTable(
  "leadership_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    leadershipId: bigint("leadership_id", { mode: "number" })
      .notNull()
      .references(() => leadership.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    name: text("name").notNull(),
    roleTitle: text("role_title"),
    bio: text("bio"),
    // No slug — index-only page, no detail pages in MVP (Phase 2/6 decision)
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("leadership_translations_member_locale_idx").on(
      t.leadershipId,
      t.locale
    ),
    index("leadership_translations_leadership_id_idx").on(t.leadershipId),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const postsRelations = relations(posts, ({ one, many }) => ({
  coverMedia: one(media, {
    fields: [posts.coverMediaId],
    references: [media.id],
  }),
  author: one(users, {
    fields: [posts.authorUserId],
    references: [users.id],
  }),
  translations: many(postTranslations),
}));

export const postTranslationsRelations = relations(
  postTranslations,
  ({ one }) => ({
    post: one(posts, {
      fields: [postTranslations.postId],
      references: [posts.id],
    }),
    ogImage: one(media, {
      fields: [postTranslations.ogImageId],
      references: [media.id],
    }),
  })
);

export const pagesRelations = relations(pages, ({ many }) => ({
  translations: many(pageTranslations),
}));

export const pageTranslationsRelations = relations(
  pageTranslations,
  ({ one }) => ({
    page: one(pages, {
      fields: [pageTranslations.pageId],
      references: [pages.id],
    }),
    ogImage: one(media, {
      fields: [pageTranslations.ogImageId],
      references: [media.id],
    }),
  })
);

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  coverMedia: one(media, {
    fields: [campaigns.coverMediaId],
    references: [media.id],
  }),
  translations: many(campaignTranslations),
}));

export const campaignTranslationsRelations = relations(
  campaignTranslations,
  ({ one }) => ({
    campaign: one(campaigns, {
      fields: [campaignTranslations.campaignId],
      references: [campaigns.id],
    }),
    ogImage: one(media, {
      fields: [campaignTranslations.ogImageId],
      references: [media.id],
    }),
  })
);

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  fileMedia: one(media, {
    fields: [resources.fileMediaId],
    references: [media.id],
  }),
  translations: many(resourceTranslations),
}));

export const resourceTranslationsRelations = relations(
  resourceTranslations,
  ({ one }) => ({
    resource: one(resources, {
      fields: [resourceTranslations.resourceId],
      references: [resources.id],
    }),
    ogImage: one(media, {
      fields: [resourceTranslations.ogImageId],
      references: [media.id],
    }),
  })
);

export const leadershipRelations = relations(leadership, ({ one, many }) => ({
  photo: one(media, {
    fields: [leadership.photoMediaId],
    references: [media.id],
  }),
  translations: many(leadershipTranslations),
}));

export const leadershipTranslationsRelations = relations(
  leadershipTranslations,
  ({ one }) => ({
    member: one(leadership, {
      fields: [leadershipTranslations.leadershipId],
      references: [leadership.id],
    }),
  })
);
