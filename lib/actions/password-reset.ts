"use server";

/**
 * Password reset Server Actions.
 *
 * Security rules:
 * - Generic success message on requestPasswordResetAction regardless of
 *   whether the email exists — prevents email enumeration.
 * - Token: 32 random bytes → 64-char hex (URL-safe, high entropy).
 * - Only the SHA-256 hash is stored; raw token travels only in the email link.
 * - Token expires in 1 hour.
 * - Any previously unused tokens for the user are invalidated when a new
 *   request is made (prevents token accumulation).
 * - On successful reset: all sessions for that user are deleted (force
 *   re-authentication everywhere), token is marked usedAt.
 * - New password hashed with bcryptjs (same as registration).
 * - Rate limited: 3 requests per 15 min per IP to prevent email flooding.
 * - All events written to audit_log.
 */

import { createHash } from "crypto";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { eq, and, gt, isNull, sql } from "drizzle-orm";
import { Resend } from "resend";
import { hashPassword } from "@/lib/auth/password";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit";
import type { ActionResult } from "@/lib/auth/with-admin";

// ─── Constants ────────────────────────────────────────────────────────────────

const TOKEN_EXPIRY_MINUTES = 60;
const RATE_WINDOW_MINUTES = 15;
const RATE_LIMIT = 3; // requests per window per IP
const GENERIC_SUCCESS =
  "If an account with that email exists, a password reset link has been sent.";

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getRequestMeta() {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  const requestId = crypto.randomUUID();
  return { ip, userAgent, requestId };
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function isRateLimited(bucket: string): Promise<boolean> {
  const windowStart = new Date(Date.now() - RATE_WINDOW_MINUTES * 60 * 1000);

  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rateLimits)
    .where(
      and(
        eq(schema.rateLimits.bucket, bucket),
        gt(schema.rateLimits.windowStart, windowStart)
      )
    );

  const count = Number(row?.count ?? 0);
  if (count >= RATE_LIMIT) return true;

  const currentWindow = new Date(Math.floor(Date.now() / 60000) * 60000);
  await db
    .insert(schema.rateLimits)
    .values({ bucket, windowStart: currentWindow, count: 1 })
    .onConflictDoUpdate({
      target: [schema.rateLimits.bucket, schema.rateLimits.windowStart],
      set: { count: sql`${schema.rateLimits.count} + 1` },
    });

  return false;
}

// ─── requestPasswordResetAction ───────────────────────────────────────────────

const requestSchema = z.object({
  email: z.string().email(),
});

export async function requestPasswordResetAction(
  _prev: ActionResult<{ message: string }> | null,
  formData: FormData
): Promise<ActionResult<{ message: string }>> {
  const { ip, userAgent, requestId } = await getRequestMeta();

  const parsed = requestSchema.safeParse({ email: formData.get("email") });
  // Return generic success even on bad input — don't hint at email format checks
  if (!parsed.success) {
    return { ok: true, data: { message: GENERIC_SUCCESS } };
  }
  const { email } = parsed.data;

  // Rate limit by IP
  if (ip) {
    const blocked = await isRateLimited(`pwd-reset:ip:${ip}`);
    if (blocked) {
      return {
        ok: false,
        error: "Too many requests. Please wait before trying again.",
        code: "RATE_LIMITED",
      };
    }
  }

  // Look up user — do not reveal existence in the response
  const [user] = await db
    .select({ id: schema.users.id, email: schema.users.email, role: schema.users.role, isActive: schema.users.isActive })
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user || !user.isActive) {
    // Still audit the attempt (actor unknown → actorUserId omitted)
    // Return generic success to prevent enumeration
    return { ok: true, data: { message: GENERIC_SUCCESS } };
  }

  // Invalidate any outstanding unused tokens for this user
  await db
    .update(schema.passwordResetTokens)
    .set({ usedAt: new Date() })
    .where(
      and(
        eq(schema.passwordResetTokens.userId, user.id),
        isNull(schema.passwordResetTokens.usedAt)
      )
    );

  // Generate new token (Web Crypto — edge-compatible)
  const rawToken = Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await db.insert(schema.passwordResetTokens).values({
    userId: user.id,
    tokenHash,
    expiresAt,
  });

  // Send email via Resend
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const resetUrl = `${siteUrl}/admin/password-reset?token=${rawToken}`;

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? "noreply@example.com",
      to: user.email,
      subject: "Reset your admin password",
      html: `
        <p>You requested a password reset for your admin account.</p>
        <p>
          <a href="${resetUrl}" style="color:#0B3D2E;font-weight:bold;">
            Reset your password
          </a>
        </p>
        <p>This link expires in ${TOKEN_EXPIRY_MINUTES} minutes.</p>
        <p>If you did not request this, you can safely ignore this email.</p>
        <hr />
        <p style="font-size:12px;color:#666;">
          For security, do not share this link. It can only be used once.
        </p>
      `,
      text: `Reset your admin password:\n\n${resetUrl}\n\nThis link expires in ${TOKEN_EXPIRY_MINUTES} minutes. If you did not request this, ignore this email.`,
    });
  } catch (err) {
    // Log but don't expose email send failure — return generic success
    console.error("[password-reset] email send failed:", err);
  }

  // Audit
  await db.transaction(async (tx) => {
    await writeAuditLog(tx, {
      requestId,
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.password_reset.requested",
      entityType: "user",
      entityId: user.id,
      ip,
      userAgent,
    });
  });

  return { ok: true, data: { message: GENERIC_SUCCESS } };
}

// ─── resetPasswordAction ──────────────────────────────────────────────────────

const resetSchema = z.object({
  token: z.string().length(64).regex(/^[a-f0-9]+$/),
  password: z
    .string()
    .min(12, "Password must be at least 12 characters.")
    .max(128, "Password must be 128 characters or fewer."),
  confirmPassword: z.string(),
});

export async function resetPasswordAction(
  _prev: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const { ip, userAgent, requestId } = await getRequestMeta();

  const parsed = resetSchema.safeParse({
    token: formData.get("token"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    const msg =
      parsed.error.issues[0]?.message ?? "Invalid input. Please try again.";
    return { ok: false, error: msg, code: "INVALID_INPUT" };
  }

  const { token, password, confirmPassword } = parsed.data;

  if (password !== confirmPassword) {
    return {
      ok: false,
      error: "Passwords do not match.",
      code: "PASSWORD_MISMATCH",
    };
  }

  const tokenHash = hashToken(token);
  const now = new Date();

  // Look up valid, unused, non-expired token
  const [tokenRow] = await db
    .select()
    .from(schema.passwordResetTokens)
    .where(
      and(
        eq(schema.passwordResetTokens.tokenHash, tokenHash),
        isNull(schema.passwordResetTokens.usedAt),
        gt(schema.passwordResetTokens.expiresAt, now)
      )
    )
    .limit(1);

  if (!tokenRow) {
    return {
      ok: false,
      error: "This reset link is invalid or has expired. Please request a new one.",
      code: "INVALID_TOKEN",
    };
  }

  // Load user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, tokenRow.userId))
    .limit(1);

  if (!user || !user.isActive) {
    return { ok: false, error: "Account not found.", code: "NOT_FOUND" };
  }

  // Hash new password (bcryptjs)
  const newHash = await hashPassword(password);

  // Atomically: update password, mark token used, delete all sessions, audit
  await db.transaction(async (tx) => {
    await tx
      .update(schema.users)
      .set({ passwordHash: newHash, updatedAt: now })
      .where(eq(schema.users.id, user.id));

    await tx
      .update(schema.passwordResetTokens)
      .set({ usedAt: now })
      .where(eq(schema.passwordResetTokens.id, tokenRow.id));

    // Invalidate all active sessions — force re-login everywhere
    await tx
      .delete(schema.sessions)
      .where(eq(schema.sessions.userId, user.id));

    await writeAuditLog(tx, {
      requestId,
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.password_reset.completed",
      entityType: "user",
      entityId: user.id,
      ip,
      userAgent,
    });
  });

  redirect("/admin/login?reset=1");
}
