import {
  pgTable,
  bigserial,
  bigint,
  text,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import {
  localeEnum,
  submissionKindEnum,
  submissionStatusEnum,
} from "./_enums";
import { users } from "./auth";
import { inet } from "./_types";

// ─── submissions ──────────────────────────────────────────────────────────────

export const submissions = pgTable(
  "submissions",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    kind: submissionKindEnum("kind").notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    subject: text("subject"),
    message: text("message").notNull(),
    // Locale the form was submitted in
    locale: localeEnum("locale"),
    status: submissionStatusEnum("status").notNull().default("new"),
    // Nulled after 90 days by retention job (/api/cron/retention)
    ip: inet("ip"),
    userAgent: text("user_agent"),
    adminNotes: text("admin_notes"),
    handledAt: timestamp("handled_at", { withTimezone: true }),
    handledByUserId: bigint("handled_by_user_id", { mode: "number" }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("submissions_status_created_at_idx").on(t.status, t.createdAt),
    index("submissions_kind_status_idx").on(t.kind, t.status),
    // Used by retention job to find rows where IP should be nulled
    index("submissions_created_at_idx").on(t.createdAt),
  ]
);

// ─── rate_limits ──────────────────────────────────────────────────────────────

export const rateLimits = pgTable(
  "rate_limits",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    // Bucket key e.g. 'login:ip:1.2.3.4', 'submission:ip:1.2.3.4'
    bucket: text("bucket").notNull(),
    windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
    count: bigint("count", { mode: "number" }).notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("rate_limits_bucket_window_idx").on(t.bucket, t.windowStart),
    index("rate_limits_bucket_idx").on(t.bucket, t.windowStart),
    // Retention sweep removes expired windows
    index("rate_limits_window_start_idx").on(t.windowStart),
  ]
);

// ─── slug_reservations (global slug namespace guard per locale) ───────────────

export const slugReservations = pgTable(
  "slug_reservations",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    entityType: text("entity_type").notNull(), // 'post' | 'page' | 'campaign' | 'resource'
    locale: localeEnum("locale").notNull(),
    slug: text("slug").notNull(),
    // Which entity owns this reservation
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // The core constraint: a slug can only exist once per (type, locale)
    uniqueIndex("slug_reservations_type_locale_slug_idx").on(
      t.entityType,
      t.locale,
      t.slug
    ),
    index("slug_reservations_entity_idx").on(t.entityType, t.entityId),
  ]
);

// ─── slug_redirects ───────────────────────────────────────────────────────────

export const slugRedirects = pgTable(
  "slug_redirects",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    entityType: text("entity_type").notNull(),
    locale: localeEnum("locale").notNull(),
    oldSlug: text("old_slug").notNull(),
    // Target entity — no FK so redirect survives soft-delete (Phase 6 decision)
    entityId: bigint("entity_id", { mode: "number" }).notNull(),
    createdByUserId: bigint("created_by_user_id", { mode: "number" }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("slug_redirects_type_locale_old_slug_idx").on(
      t.entityType,
      t.locale,
      t.oldSlug
    ),
    index("slug_redirects_entity_id_idx").on(t.entityId),
  ]
);

// ─── audit_log ────────────────────────────────────────────────────────────────

export type AuditDiff = Record<string, unknown>;

export const auditLog = pgTable(
  "audit_log",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    requestId: text("request_id").notNull(),
    // Null for system-initiated events (e.g. break-glass, cron)
    actorUserId: bigint("actor_user_id", { mode: "number" }).references(
      () => users.id,
      { onDelete: "set null" }
    ),
    // Snapshot of role at the time of action
    actorRole: text("actor_role"),
    // Action enum values — enforced as a string here; validated in app layer
    action: text("action").notNull(),
    entityType: text("entity_type"),
    entityId: bigint("entity_id", { mode: "number" }),
    localeAffected: localeEnum("locale_affected"),
    // Redacted diff: never contains password_hash, totp_secret, recovery codes
    diff: jsonb("diff").$type<AuditDiff>(),
    ip: inet("ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // Primary read pattern: most recent entries first
    index("audit_log_at_desc_idx").on(t.at),
    // Entity history lookup
    index("audit_log_entity_idx").on(t.entityType, t.entityId, t.at),
    // Actor history lookup
    index("audit_log_actor_idx").on(t.actorUserId, t.at),
    // Action filtering
    index("audit_log_action_idx").on(t.action, t.at),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const submissionsRelations = relations(submissions, ({ one }) => ({
  handledBy: one(users, {
    fields: [submissions.handledByUserId],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  actor: one(users, {
    fields: [auditLog.actorUserId],
    references: [users.id],
  }),
}));

export const slugRedirectsRelations = relations(slugRedirects, ({ one }) => ({
  createdBy: one(users, {
    fields: [slugRedirects.createdByUserId],
    references: [users.id],
  }),
}));
