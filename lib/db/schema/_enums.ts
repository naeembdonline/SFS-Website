import { pgEnum } from "drizzle-orm/pg-core";

/** Supported locales — must match lib/i18n/config.ts */
export const localeEnum = pgEnum("locale_t", ["bn", "en", "ar"]);

/** Draft / published status on every translation row */
export const contentStatusEnum = pgEnum("content_status", [
  "draft",
  "published",
]);

/** Admin user roles */
export const userRoleEnum = pgEnum("user_role", ["admin", "editor"]);

/** Post content type */
export const postTypeEnum = pgEnum("post_type", ["blog", "news"]);

/** Resource asset kind */
export const resourceKindEnum = pgEnum("resource_kind", ["pdf", "link", "doc"]);

/** Campaign lifecycle state — distinct from publish status */
export const campaignLifecycleEnum = pgEnum("campaign_lifecycle", [
  "active",
  "past",
]);

/** Public submission kind */
export const submissionKindEnum = pgEnum("submission_kind", [
  "contact",
  "advisory",
]);

/** Submission review status */
export const submissionStatusEnum = pgEnum("submission_status", [
  "new",
  "reviewed",
  "handled",
  "archived",
]);

/** Navigation menu placement */
export const navMenuEnum = pgEnum("nav_menu", ["header", "footer"]);

/** Navigation item link kind */
export const navLinkKindEnum = pgEnum("nav_link_kind", ["route", "external"]);
