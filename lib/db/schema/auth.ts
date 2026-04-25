import {
  pgTable,
  bigserial,
  bigint,
  text,
  boolean,
  timestamp,
  integer,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { userRoleEnum } from "./_enums";
import { citext, inet, bytea } from "./_types";

// ─── users ────────────────────────────────────────────────────────────────────

export const users = pgTable(
  "users",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    email: citext("email").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull(),
    displayName: text("display_name"),
    isActive: boolean("is_active").notNull().default(true),
    // TOTP secret encrypted at rest (AES-256-GCM, key from env)
    totpSecretEncrypted: bytea("totp_secret_encrypted"),
    totpEnabled: boolean("totp_enabled").notNull().default(false),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    failedLoginCount: integer("failed_login_count").notNull().default(0),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // email unique index already created by .unique() above;
    // explicit named index for consistent naming in migrations
    uniqueIndex("users_email_idx").on(t.email),
    index("users_role_idx").on(t.role),
    index("users_is_active_idx").on(t.isActive),
  ]
);

// ─── sessions (Auth.js DB strategy) ───────────────────────────────────────────

export const sessions = pgTable(
  "sessions",
  {
    // Auth.js manages session ID generation (opaque token)
    id: text("id").primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdIp: inet("created_ip"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("sessions_user_id_idx").on(t.userId),
    index("sessions_expires_at_idx").on(t.expiresAt),
  ]
);

// ─── password_reset_tokens ────────────────────────────────────────────────────

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Only the hash is stored; raw token is sent in the email link
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("prt_token_hash_idx").on(t.tokenHash),
    index("prt_user_id_idx").on(t.userId),
    index("prt_expires_at_idx").on(t.expiresAt),
  ]
);

// ─── totp_recovery_codes ──────────────────────────────────────────────────────

export const totpRecoveryCodes = pgTable(
  "totp_recovery_codes",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Stored as Argon2id hash; raw code shown to user once at enrollment
    codeHash: text("code_hash").notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("totp_rc_user_id_idx").on(t.userId),
    // Partial-like: only unused codes matter for lookup — filtered in app
    index("totp_rc_user_unused_idx").on(t.userId, t.usedAt),
  ]
);

// ─── Relations ────────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  passwordResetTokens: many(passwordResetTokens),
  totpRecoveryCodes: many(totpRecoveryCodes),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(
  passwordResetTokens,
  ({ one }) => ({
    user: one(users, {
      fields: [passwordResetTokens.userId],
      references: [users.id],
    }),
  })
);

export const totpRecoveryCodesRelations = relations(
  totpRecoveryCodes,
  ({ one }) => ({
    user: one(users, {
      fields: [totpRecoveryCodes.userId],
      references: [users.id],
    }),
  })
);
