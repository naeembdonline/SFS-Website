"use server";

/**
 * User management Server Actions.
 *
 * All actions are restricted to the "admin" role via withAdmin(fn, { role: "admin" }).
 * No hard deletes — users are only deactivated (isActive toggle).
 *
 * Invite flow:
 *   1. Create user row with a random unusable password hash.
 *   2. Insert a password_reset_token (same table as password reset).
 *   3. Email the token link — user clicks it and sets their own password.
 *
 * Security rules:
 *   - An admin cannot deactivate or change the role of their own account
 *     to prevent accidental self-lockout.
 *   - All actions write to audit_log inside the same transaction.
 *   - Never log password_hash or token values.
 */

import { createHash } from "crypto";
import { eq, and, isNull } from "drizzle-orm";
import { Resend } from "resend";
import { hashPassword } from "@/lib/auth/password";
import { revalidateTag } from "next/cache";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  withAdmin,
  ActionError,
  type ActionState,
} from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  inviteUserSchema,
  setUserActiveSchema,
  changeUserRoleSchema,
} from "@/lib/validation/users";

// ─── Constants ────────────────────────────────────────────────────────────────

const SETUP_TOKEN_EXPIRY_HOURS = 72; // invite link valid for 3 days

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Web Crypto-based random hex — works on edge and Node alike. */
function randomHex(byteCount: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(byteCount));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

function revalidateUsersTags() {
  revalidateTag("admin-users", "max");
}

// ─── inviteUserAction ─────────────────────────────────────────────────────────

export async function inviteUserAction(
  _prev: ActionState<{ userId: number }>,
  formData: FormData
): Promise<ActionState<{ userId: number }>> {
  return withAdmin(
    async (ctx) => {
      const parsed = inviteUserSchema.safeParse({
        email: formData.get("email"),
        displayName: formData.get("displayName"),
        role: formData.get("role"),
      });
      if (!parsed.success) {
        throw new ActionError(
          parsed.error.issues[0]?.message ?? "Validation failed",
          "VALIDATION_ERROR"
        );
      }
      const { email, displayName, role } = parsed.data;

      // Check for existing user (including deactivated)
      const [existing] = await db
        .select({ id: schema.users.id, isActive: schema.users.isActive })
        .from(schema.users)
        .where(eq(schema.users.email, email))
        .limit(1);

      if (existing) {
        throw new ActionError(
          "An account with that email already exists.",
          "DUPLICATE_EMAIL"
        );
      }

      // Random placeholder password — user will set their own via the invite link
      const placeholderPassword = randomHex(32);
      const passwordHash = await hashPassword(placeholderPassword);

      let newUserId!: number;

      const rawToken = randomHex(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      await db.transaction(async (tx) => {
        const [newUser] = await tx
          .insert(schema.users)
          .values({
            email,
            displayName,
            role,
            passwordHash,
            isActive: true,
          })
          .returning({ id: schema.users.id });

        newUserId = newUser.id;

        await tx.insert(schema.passwordResetTokens).values({
          userId: newUserId,
          tokenHash,
          expiresAt,
        });

        await writeAuditLog(tx, {
          requestId: ctx.requestId,
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "user.invite",
          entityType: "user",
          entityId: newUserId,
          diff: { email, displayName, role },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
      });

      // Send invite email — non-fatal if it fails
      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const setupUrl = `${siteUrl}/admin/password-reset?token=${rawToken}`;

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "noreply@example.com",
          to: email,
          subject: "You've been invited to the admin panel",
          html: `
            <p>Hello${displayName ? ` ${displayName}` : ""},</p>
            <p>You have been invited to access the admin panel as <strong>${role}</strong>.</p>
            <p>
              <a href="${setupUrl}" style="color:#0B3D2E;font-weight:bold;">
                Set up your account
              </a>
            </p>
            <p>This link expires in ${SETUP_TOKEN_EXPIRY_HOURS} hours.</p>
            <p>If you were not expecting this invitation, you can safely ignore this email.</p>
          `,
          text: `You've been invited to the admin panel as ${role}.\n\nSet up your account:\n${setupUrl}\n\nThis link expires in ${SETUP_TOKEN_EXPIRY_HOURS} hours.`,
        });
      } catch (err) {
        console.error("[users] invite email send failed:", err);
        // Still return success — admin can resend or share link manually
      }

      revalidateUsersTags();
      return { userId: newUserId };
    },
    { role: "admin" }
  );
}

// ─── setUserActiveAction ──────────────────────────────────────────────────────

export async function setUserActiveAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(
    async (ctx) => {
      const parsed = setUserActiveSchema.safeParse({
        userId: Number(formData.get("userId")),
        isActive: formData.get("isActive") === "true",
      });
      if (!parsed.success) {
        throw new ActionError("Invalid input", "VALIDATION_ERROR");
      }
      const { userId, isActive } = parsed.data;

      if (userId === ctx.user.id) {
        throw new ActionError(
          "You cannot deactivate your own account.",
          "SELF_ACTION"
        );
      }

      const [user] = await db
        .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!user) throw new ActionError("User not found", "NOT_FOUND");

      await db.transaction(async (tx) => {
        await tx
          .update(schema.users)
          .set({ isActive, updatedAt: new Date() })
          .where(eq(schema.users.id, userId));

        // If deactivating, invalidate all sessions immediately
        if (!isActive) {
          await tx
            .delete(schema.sessions)
            .where(eq(schema.sessions.userId, userId));
        }

        await writeAuditLog(tx, {
          requestId: ctx.requestId,
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: isActive ? "user.reactivate" : "user.deactivate",
          entityType: "user",
          entityId: userId,
          diff: { email: user.email, isActive },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
      });

      revalidateUsersTags();
    },
    { role: "admin" }
  );
}

// ─── changeUserRoleAction ─────────────────────────────────────────────────────

export async function changeUserRoleAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(
    async (ctx) => {
      const parsed = changeUserRoleSchema.safeParse({
        userId: Number(formData.get("userId")),
        role: formData.get("role"),
      });
      if (!parsed.success) {
        throw new ActionError(
          parsed.error.issues[0]?.message ?? "Invalid input",
          "VALIDATION_ERROR"
        );
      }
      const { userId, role } = parsed.data;

      if (userId === ctx.user.id) {
        throw new ActionError(
          "You cannot change your own role.",
          "SELF_ACTION"
        );
      }

      const [user] = await db
        .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!user) throw new ActionError("User not found", "NOT_FOUND");
      if (user.role === role) {
        throw new ActionError(
          `User is already ${role}.`,
          "NO_CHANGE"
        );
      }

      await db.transaction(async (tx) => {
        await tx
          .update(schema.users)
          .set({ role, updatedAt: new Date() })
          .where(eq(schema.users.id, userId));

        await writeAuditLog(tx, {
          requestId: ctx.requestId,
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "user.role_change",
          entityType: "user",
          entityId: userId,
          diff: { email: user.email, fromRole: user.role, toRole: role },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
      });

      revalidateUsersTags();
    },
    { role: "admin" }
  );
}

// ─── resendInviteAction ───────────────────────────────────────────────────────

export async function resendInviteAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(
    async (ctx) => {
      const userId = Number(formData.get("userId"));
      if (!Number.isInteger(userId) || userId <= 0) {
        throw new ActionError("Invalid user ID", "VALIDATION_ERROR");
      }

      const [user] = await db
        .select({
          id: schema.users.id,
          email: schema.users.email,
          displayName: schema.users.displayName,
          role: schema.users.role,
          isActive: schema.users.isActive,
        })
        .from(schema.users)
        .where(eq(schema.users.id, userId))
        .limit(1);

      if (!user) throw new ActionError("User not found", "NOT_FOUND");
      if (!user.isActive)
        throw new ActionError("Cannot resend invite to deactivated user.", "INACTIVE");

      // Invalidate existing unused tokens
      await db
        .update(schema.passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(
          and(
            eq(schema.passwordResetTokens.userId, userId),
            isNull(schema.passwordResetTokens.usedAt)
          )
        );

      const rawToken = randomHex(32);
      const tokenHash = hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + SETUP_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000
      );

      await db.transaction(async (tx) => {
        await tx.insert(schema.passwordResetTokens).values({
          userId,
          tokenHash,
          expiresAt,
        });

        await writeAuditLog(tx, {
          requestId: ctx.requestId,
          actorUserId: ctx.user.id,
          actorRole: ctx.user.role,
          action: "user.invite_resend",
          entityType: "user",
          entityId: userId,
          diff: { email: user.email },
          ip: ctx.ip,
          userAgent: ctx.userAgent,
        });
      });

      const siteUrl =
        process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const setupUrl = `${siteUrl}/admin/password-reset?token=${rawToken}`;

      try {
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: process.env.EMAIL_FROM ?? "noreply@example.com",
          to: user.email,
          subject: "Your admin panel invite (resent)",
          html: `
            <p>Hello${user.displayName ? ` ${user.displayName}` : ""},</p>
            <p>Here is a new link to set up your admin account as <strong>${user.role}</strong>.</p>
            <p>
              <a href="${setupUrl}" style="color:#0B3D2E;font-weight:bold;">
                Set up your account
              </a>
            </p>
            <p>This link expires in ${SETUP_TOKEN_EXPIRY_HOURS} hours.</p>
          `,
          text: `Set up your admin account:\n${setupUrl}\n\nThis link expires in ${SETUP_TOKEN_EXPIRY_HOURS} hours.`,
        });
      } catch (err) {
        console.error("[users] resend invite email failed:", err);
      }
    },
    { role: "admin" }
  );
}
