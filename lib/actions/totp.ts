"use server";

/**
 * TOTP / 2FA Server Actions.
 *
 * generateTotpSecretAction  — generates a fresh secret + QR data URL for the
 *                             setup page. Does NOT persist anything yet.
 *
 * enableTotpAction          — verifies a TOTP code, then atomically:
 *                             1. Encrypts and saves the secret to users
 *                             2. Generates + hashes 8 recovery codes
 *                             3. Inserts hashed codes to totp_recovery_codes
 *                             4. Sets totp_enabled = true
 *                             5. Writes audit log
 *                             Returns the raw recovery codes (shown once).
 *
 * verifyTotpChallengeAction — called from /admin/totp-challenge after the
 *                             password-authenticated pending session.
 *                             Verifies code (or recovery code), then creates
 *                             a real session and redirects to /admin.
 */

import { createHmac } from "crypto";
import { z } from "zod";
import { eq, and, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { cookies, headers } from "next/headers";
import QRCode from "qrcode";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import {
  generateTotpSecret,
  encryptTotpSecret,
  decryptTotpSecret,
  verifyTotpCodeFromSecret,
  generateRecoveryCodes,
  hashRecoveryCode,
  compareRecoveryCodeHash,
} from "@/lib/auth/totp";
import { createSession, setSessionCookie } from "@/lib/auth/session";
import type { ActionResult } from "@/lib/auth/with-admin";

// ─── generateTotpSecretAction ─────────────────────────────────────────────────

export interface TotpSetupData {
  secret: string;
  qrDataUrl: string;
}

export async function generateTotpSecretAction(): Promise<
  ActionResult<TotpSetupData>
> {
  return withAdmin(async (ctx) => {
    const { secret, otpauthUrl } = generateTotpSecret(ctx.user.email, "SFS Admin");

    const qrDataUrl = await QRCode.toDataURL(otpauthUrl, {
      width: 256,
      margin: 2,
      color: { dark: "#0B3D2E", light: "#FFFFFF" },
    });

    return { secret, qrDataUrl };
  });
}

// ─── enableTotpAction ─────────────────────────────────────────────────────────

const enableSchema = z.object({
  secret: z.string().min(16).max(64),
  code: z.string().length(6).regex(/^\d+$/),
});

export interface EnableTotpData {
  recoveryCodes: string[];
}

export async function enableTotpAction(
  _prev: ActionResult<EnableTotpData> | null,
  formData: FormData
): Promise<ActionResult<EnableTotpData>> {
  return withAdmin(async (ctx) => {
    const parsed = enableSchema.safeParse({
      secret: formData.get("secret"),
      code: formData.get("code"),
    });
    if (!parsed.success) {
      throw new ActionError("Invalid input.", "INVALID_INPUT");
    }
    const { secret, code } = parsed.data;

    if (!verifyTotpCodeFromSecret(secret, code)) {
      throw new ActionError(
        "Invalid TOTP code. Check your authenticator and try again.",
        "INVALID_TOTP"
      );
    }

    const rawCodes = generateRecoveryCodes(8);
    const hashedCodes = rawCodes.map(hashRecoveryCode);

    // We store the base32 secret (UTF-8 bytes) encrypted in the DB.
    // On verification we decrypt → UTF-8 → base32 string → decode → key buffer.
    const secretBuf = Buffer.from(secret, "utf8");
    const encrypted = encryptTotpSecret(secretBuf);

    await db.transaction(async (tx) => {
      await tx
        .update(schema.users)
        .set({ totpSecretEncrypted: encrypted, totpEnabled: true, updatedAt: new Date() })
        .where(eq(schema.users.id, ctx.user.id));

      // Replace any old recovery codes
      await tx
        .delete(schema.totpRecoveryCodes)
        .where(eq(schema.totpRecoveryCodes.userId, ctx.user.id));

      await tx.insert(schema.totpRecoveryCodes).values(
        hashedCodes.map((h) => ({ userId: ctx.user.id, codeHash: h }))
      );

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "auth.totp.enabled",
        entityType: "user",
        entityId: ctx.user.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    return { recoveryCodes: rawCodes };
  });
}

// ─── Pending-2FA cookie helpers ───────────────────────────────────────────────
//
// After password auth succeeds for a TOTP-enabled user, loginAction issues a
// short-lived signed cookie and redirects to /admin/totp-challenge.
// The cookie carries userId + HMAC so it cannot be tampered with.
//
// Cookie name: __Host-admin-2fa-pending  (Host prefix: Secure + Path=/ enforced)

const PENDING_COOKIE = "__Host-admin-2fa-pending";
const PENDING_MAX_AGE = 300; // 5 minutes

function pendingHmac(userId: number): string {
  const key = process.env.TOTP_ENCRYPTION_KEY ?? "";
  return createHmac("sha256", key).update(String(userId)).digest("hex").slice(0, 32);
}

export async function setPendingTotpCookie(userId: number): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PENDING_COOKIE, `${userId}:${pendingHmac(userId)}`, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: PENDING_MAX_AGE,
  });
}

export async function getPendingTotpUserId(): Promise<number | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_COOKIE)?.value;
  if (!value) return null;
  const [idStr, mac] = value.split(":");
  const userId = parseInt(idStr, 10);
  if (isNaN(userId) || mac !== pendingHmac(userId)) return null;
  return userId;
}

async function clearPendingTotpCookie(): Promise<void> {
  (await cookies()).delete(PENDING_COOKIE);
}

// ─── verifyTotpChallengeAction ────────────────────────────────────────────────

const challengeSchema = z.object({
  code: z.string().min(1).max(20),
});

export async function verifyTotpChallengeAction(
  _prev: ActionResult<void> | null,
  formData: FormData
): Promise<ActionResult<void>> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  const requestId = crypto.randomUUID();

  const parsed = challengeSchema.safeParse({ code: formData.get("code") });
  if (!parsed.success) {
    return { ok: false, error: "Please enter your 6-digit code.", code: "INVALID_INPUT" };
  }
  const { code } = parsed.data;

  const userId = await getPendingTotpUserId();
  if (!userId) {
    return {
      ok: false,
      error: "Session expired. Please sign in again.",
      code: "NO_PENDING_SESSION",
    };
  }

  const [user] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.id, userId))
    .limit(1);

  if (!user || !user.isActive) {
    await clearPendingTotpCookie();
    return { ok: false, error: "Account not found.", code: "NOT_FOUND" };
  }

  // Recovery codes are 11 chars (XXXXX-XXXXX); TOTP codes are exactly 6 digits
  const isRecovery = code.length !== 6 || code.includes("-");
  let verified = false;

  if (isRecovery) {
    const unusedCodes = await db
      .select()
      .from(schema.totpRecoveryCodes)
      .where(
        and(
          eq(schema.totpRecoveryCodes.userId, userId),
          isNull(schema.totpRecoveryCodes.usedAt)
        )
      );

    for (const rc of unusedCodes) {
      if (compareRecoveryCodeHash(code, rc.codeHash)) {
        await db
          .update(schema.totpRecoveryCodes)
          .set({ usedAt: new Date() })
          .where(eq(schema.totpRecoveryCodes.id, rc.id));
        verified = true;
        break;
      }
    }
  } else {
    if (user.totpSecretEncrypted) {
      // DB returns bytea as Buffer in pg driver; handle both Buffer and raw
      const raw = user.totpSecretEncrypted as unknown;
      const encBuf = Buffer.isBuffer(raw)
        ? raw
        : Buffer.from(raw as string, "hex");
      const secretBuf = decryptTotpSecret(encBuf);
      verified = verifyTotpCodeFromSecret(secretBuf.toString("utf8"), code);
    }
  }

  if (!verified) {
    await db.transaction(async (tx) => {
      await writeAuditLog(tx, {
        requestId,
        actorUserId: userId,
        actorRole: user.role,
        action: "auth.totp.challenge.failed",
        entityType: "user",
        entityId: userId,
        diff: { method: isRecovery ? "recovery" : "totp" },
        ip,
        userAgent,
      });
    });
    return { ok: false, error: "Invalid code. Please try again.", code: "INVALID_TOTP" };
  }

  // Success — clear pending cookie, create real session
  await clearPendingTotpCookie();
  const sessionToken = await createSession(userId, { ip, userAgent });
  await setSessionCookie(sessionToken);

  await db
    .update(schema.users)
    .set({ failedLoginCount: 0, lockedUntil: null, lastLoginAt: new Date(), updatedAt: new Date() })
    .where(eq(schema.users.id, userId));

  await db.transaction(async (tx) => {
    await writeAuditLog(tx, {
      requestId,
      actorUserId: userId,
      actorRole: user.role,
      action: "auth.totp.challenge.success",
      entityType: "user",
      entityId: userId,
      diff: { method: isRecovery ? "recovery" : "totp" },
      ip,
      userAgent,
    });
  });

  redirect("/admin");
}

// ─── getRecoveryCodeStatusAction ──────────────────────────────────────────────
//
// Returns how many recovery codes remain unused — shown on the recovery page
// so the user knows whether to regenerate. No raw codes are returned.

export interface RecoveryCodeStatus {
  total: number;
  used: number;
  remaining: number;
}

export async function getRecoveryCodeStatusAction(): Promise<
  ActionResult<RecoveryCodeStatus>
> {
  return withAdmin(async (ctx) => {
    const rows = await db
      .select({ usedAt: schema.totpRecoveryCodes.usedAt })
      .from(schema.totpRecoveryCodes)
      .where(eq(schema.totpRecoveryCodes.userId, ctx.user.id));

    const total = rows.length;
    const used = rows.filter((r) => r.usedAt !== null).length;
    return { total, used, remaining: total - used };
  });
}

// ─── regenerateRecoveryCodesAction ────────────────────────────────────────────
//
// Generates a fresh set of 8 recovery codes, replaces the old ones, and
// returns the raw codes (shown to the user once). Requires a current valid
// TOTP code to confirm intent — prevents a stolen session from silently
// replacing codes.

const regenerateSchema = z.object({
  code: z.string().length(6).regex(/^\d+$/, "Enter your 6-digit TOTP code."),
});

export interface RegenerateCodesData {
  recoveryCodes: string[];
}

export async function regenerateRecoveryCodesAction(
  _prev: ActionResult<RegenerateCodesData> | null,
  formData: FormData
): Promise<ActionResult<RegenerateCodesData>> {
  return withAdmin(async (ctx) => {
    const parsed = regenerateSchema.safeParse({ code: formData.get("code") });
    if (!parsed.success) {
      throw new ActionError(
        parsed.error.issues[0]?.message ?? "Invalid code.",
        "INVALID_INPUT"
      );
    }

    // Re-verify current TOTP before replacing codes
    const [user] = await db
      .select({ totpSecretEncrypted: schema.users.totpSecretEncrypted })
      .from(schema.users)
      .where(eq(schema.users.id, ctx.user.id))
      .limit(1);

    if (!user?.totpSecretEncrypted) {
      throw new ActionError("2FA is not enabled on this account.", "NOT_ENABLED");
    }

    const raw = user.totpSecretEncrypted as unknown;
    const encBuf = Buffer.isBuffer(raw) ? raw : Buffer.from(raw as string, "hex");
    const secretBuf = decryptTotpSecret(encBuf);
    const valid = verifyTotpCodeFromSecret(secretBuf.toString("utf8"), parsed.data.code);

    if (!valid) {
      throw new ActionError(
        "Incorrect TOTP code. Please try again.",
        "INVALID_TOTP"
      );
    }

    const rawCodes = generateRecoveryCodes(8);
    const hashedCodes = rawCodes.map(hashRecoveryCode);

    await db.transaction(async (tx) => {
      await tx
        .delete(schema.totpRecoveryCodes)
        .where(eq(schema.totpRecoveryCodes.userId, ctx.user.id));

      await tx.insert(schema.totpRecoveryCodes).values(
        hashedCodes.map((h) => ({ userId: ctx.user.id, codeHash: h }))
      );

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "auth.totp.recovery_codes.regenerated",
        entityType: "user",
        entityId: ctx.user.id,
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });

    return { recoveryCodes: rawCodes };
  });
}
