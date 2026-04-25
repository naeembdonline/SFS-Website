import {
  pgTable,
  bigserial,
  bigint,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
  check,
} from "drizzle-orm/pg-core";
import { sql, relations } from "drizzle-orm";
import { localeEnum, navMenuEnum, navLinkKindEnum } from "./_enums";
import { media } from "./media";

// ─── navigation_items ─────────────────────────────────────────────────────────

export const navigationItems = pgTable(
  "navigation_items",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    menu: navMenuEnum("menu").notNull(),
    // Reserved for future depth; MVP keeps flat (enforced in app layer)
    parentId: bigint("parent_id", { mode: "number" }),
    displayOrder: integer("display_order").notNull().default(0),
    linkKind: navLinkKindEnum("link_kind").notNull(),
    // Stable route key: 'home', 'about', 'blog', etc.
    routeKey: text("route_key"),
    // Used when link_kind = 'external'
    externalUrl: text("external_url"),
    isVisible: boolean("is_visible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("nav_items_menu_order_idx").on(t.menu, t.displayOrder),
    index("nav_items_parent_id_idx").on(t.parentId),
    // Exactly one of routeKey / externalUrl must be set — enforced in Zod + migration check
    check(
      "nav_items_link_check",
      sql`(link_kind = 'route' AND route_key IS NOT NULL AND external_url IS NULL)
          OR (link_kind = 'external' AND external_url IS NOT NULL AND route_key IS NULL)`
    ),
  ]
);

export const navigationItemTranslations = pgTable(
  "navigation_item_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    navigationItemId: bigint("navigation_item_id", { mode: "number" })
      .notNull()
      .references(() => navigationItems.id, { onDelete: "cascade" }),
    locale: localeEnum("locale").notNull(),
    label: text("label").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("nav_item_translations_item_locale_idx").on(
      t.navigationItemId,
      t.locale
    ),
    index("nav_item_translations_item_id_idx").on(t.navigationItemId),
  ]
);

// ─── site_settings (singleton — id is always 1) ───────────────────────────────

export type SocialLink = {
  platform: string;
  url: string;
};

export const siteSettings = pgTable(
  "site_settings",
  {
    // Singleton: only one row, id = 1. Enforced by check constraint + app logic.
    id: integer("id").primaryKey().default(1),
    logoMediaId: bigint("logo_media_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    defaultOgImageId: bigint("default_og_image_id", { mode: "number" }).references(
      () => media.id,
      { onDelete: "set null" }
    ),
    contactEmail: text("contact_email"),
    contactPhone: text("contact_phone"),
    address: text("address"),
    // Array of { platform, url }
    socials: jsonb("socials").$type<SocialLink[]>().default([]),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  () => [
    // Enforce singleton: only id=1 is allowed
    check("site_settings_singleton", sql`id = 1`),
  ]
);

export const siteSettingsTranslations = pgTable(
  "site_settings_translations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    locale: localeEnum("locale").notNull().unique(),
    siteName: text("site_name").notNull(),
    tagline: text("tagline"),
    footerText: text("footer_text"),
    defaultMetaDescription: text("default_meta_description"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One row per locale; .unique() above creates the constraint
    uniqueIndex("site_settings_translations_locale_idx").on(t.locale),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const navigationItemsRelations = relations(
  navigationItems,
  ({ one, many }) => ({
    parent: one(navigationItems, {
      fields: [navigationItems.parentId],
      references: [navigationItems.id],
      relationName: "nav_item_parent",
    }),
    children: many(navigationItems, {
      relationName: "nav_item_parent",
    }),
    translations: many(navigationItemTranslations),
  })
);

export const navigationItemTranslationsRelations = relations(
  navigationItemTranslations,
  ({ one }) => ({
    item: one(navigationItems, {
      fields: [navigationItemTranslations.navigationItemId],
      references: [navigationItems.id],
    }),
  })
);

export const siteSettingsRelations = relations(siteSettings, ({ one }) => ({
  logo: one(media, {
    fields: [siteSettings.logoMediaId],
    references: [media.id],
  }),
  defaultOgImage: one(media, {
    fields: [siteSettings.defaultOgImageId],
    references: [media.id],
  }),
}));
