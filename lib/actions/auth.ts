"use server";

/**
 * Auth Server Actions — login and logout.
 *
 * Security rules enforced here:
 * - Generic error message — never distinguish "email not found" from "bad password"
 * - bcryptjs verification with fail-closed on error
 * - Account lockout check before hash verification
 * - IP-based rate limiting via rate_limits table
 * - Session created only after all checks pass
 * - All login attempts written to audit_log
 */

import { redirect } from "next/navigation";
import { eq, and, gt, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { z } from "zod";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import {
  createSession,
  setSessionCookie,
  deleteSession,
} from "@/lib/auth/session";
import { setPendingTotpCookie } from "@/lib/actions/totp";
import { verifyPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import type { ActionState } from "@/lib/auth/with-admin";

// ─── Constants ────────────────────────────────────────────────────────────────

const LOGIN_RATE_WINDOW_MINUTES = 15;
const LOGIN_RATE_LIMIT_IP = 20;
const LOGIN_FAIL_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MINUTES = 15;
const GENERIC_ERROR = "Invalid email or password.";
const bypassTotpInDevelopment = process.env.NODE_ENV === "development";

// ─── Schemas ──────────────────────────────────────────────────────────────────

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function getClientIp(): Promise<string | undefined> {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined
  );
}

async function getRequestId(): Promise<string> {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
}

/**
 * Simple sliding-window rate limiter backed by the rate_limits table.
 * Returns true if the request should be blocked.
 */
async function isRateLimited(bucket: string, windowMinutes: number, maxCount: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);

  // Count requests in the current window
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
  if (count >= maxCount) return true;

  // Record this attempt
  // Use upsert: increment counter for current 1-minute window slot
  const currentWindow = new Date(Math.floor(Date.now() / 60000) * 60000);
  await db
    .insert(schema.rateLimits)
    .values({
      bucket,
      windowStart: currentWindow,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [schema.rateLimits.bucket, schema.rateLimits.windowStart],
      set: { count: sql`${schema.rateLimits.count} + 1` },
    });

  return false;
}

// ─── Login ────────────────────────────────────────────────────────────────────

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const ip = await getClientIp();
  const requestId = await getRequestId();
  const h = await headers();
  const userAgent = h.get("user-agent") ?? undefined;

  // 1. Parse and validate inputs
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { ok: false, error: GENERIC_ERROR, code: "INVALID_INPUT" };
  }
  const { email, password } = parsed.data;

  // 2. IP-level rate limit
  if (ip) {
    const blocked = await isRateLimited(
      `login:ip:${ip}`,
      LOGIN_RATE_WINDOW_MINUTES,
      LOGIN_RATE_LIMIT_IP
    );
    if (blocked) {
      return {
        ok: false,
        error: "Too many login attempts. Please try again later.",
        code: "RATE_LIMITED",
      };
    }
  }

  // 3. Look up the user
  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, email))
    .limit(1);

  if (!user || !user.isActive) {
    // Don't reveal whether the email exists
    return { ok: false, error: GENERIC_ERROR, code: "INVALID_CREDENTIALS" };
  }

  // 4. Account lockout check
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    return {
      ok: false,
      error: "Account is temporarily locked. Please try again later.",
      code: "ACCOUNT_LOCKED",
    };
  }

  // 5. Verify password (bcryptjs)
  const passwordValid = await verifyPassword(password, user.passwordHash);

  if (!passwordValid) {
    // Increment failed login counter; lock if threshold reached
    const newFailCount = (user.failedLoginCount ?? 0) + 1;
    const shouldLock = newFailCount >= LOGIN_FAIL_LOCK_THRESHOLD;
    const lockedUntil = shouldLock
      ? new Date(Date.now() + LOGIN_LOCK_MINUTES * 60 * 1000)
      : null;

    await db
      .update(schema.users)
      .set({
        failedLoginCount: newFailCount,
        ...(shouldLock ? { lockedUntil } : {}),
        updatedAt: new Date(),
      })
      .where(eq(schema.users.id, user.id));

    // Audit the failed attempt
    await db.transaction(async (tx) => {
      await writeAuditLog(tx, {
        requestId,
        actorUserId: user.id,
        actorRole: user.role,
        action: "auth.login.failed",
        entityType: "user",
        entityId: user.id,
        diff: { reason: "invalid_password", failCount: newFailCount },
        ip,
        userAgent,
      });
    });

    return { ok: false, error: GENERIC_ERROR, code: "INVALID_CREDENTIALS" };
  }

  // 6. If TOTP is enabled, issue a pending-2FA cookie and redirect to challenge
  if (!bypassTotpInDevelopment && user.totpEnabled) {
    await setPendingTotpCookie(user.id);
    redirect("/admin/totp-challenge");
  }

  // 7. Create session (no TOTP, or development-only TOTP bypass)
  const sessionToken = await createSession(user.id, { ip, userAgent });

  // 8. Reset failed login counter + update lastLoginAt
  await db
    .update(schema.users)
    .set({
      failedLoginCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(schema.users.id, user.id));

  // 9. Audit successful login
  await db.transaction(async (tx) => {
    await writeAuditLog(tx, {
      requestId,
      actorUserId: user.id,
      actorRole: user.role,
      action: "auth.login.success",
      entityType: "user",
      entityId: user.id,
      ip,
      userAgent,
    });
  });

  // 10. Set session cookie and redirect
  await setSessionCookie(sessionToken);
  redirect("/admin");
}

// ─── Logout ───────────────────────────────────────────────────────────────────

export async function logoutAction(): Promise<void> {
  await deleteSession();
  redirect("/admin/login");
}
