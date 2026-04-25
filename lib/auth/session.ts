/**
 * Custom session management.
 *
 * Design:
 * - Session token: 32 random bytes → 64-char hex string
 * - Stored raw in the DB as sessions.id (text PK)
 * - Transmitted as an httpOnly, Secure, SameSite=Lax cookie
 * - Duration: 8 h from creation (SESSION_MAX_AGE_SECONDS)
 * - Sliding renewal: re-set the cookie on each authenticated request
 *   so active users stay logged in up to 8 h of idle time
 *
 * We do NOT use Auth.js here because our users table uses bigserial
 * PKs, encrypted TOTP secrets, and custom role/lockout columns that
 * are incompatible with the @auth/drizzle-adapter default schema.
 * A dedicated auth phase (TOTP enrollment, 2FA challenge) will layer
 * on top of these primitives.
 */

import { cookies } from "next/headers";
import { eq, gt, and } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// ─── Constants ────────────────────────────────────────────────────────────────

export const SESSION_COOKIE = "__Host-admin-sess";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours
const SESSION_RENEW_THRESHOLD_SECONDS = 60 * 60 * 4; // renew if > 4 h old

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionUser {
  id: number;
  email: string;
  role: "admin" | "editor";
  displayName: string | null;
  isActive: boolean;
  totpEnabled: boolean;
}

export interface AdminSession {
  sessionId: string;
  user: SessionUser;
  expiresAt: Date;
}

// ─── Token helpers ────────────────────────────────────────────────────────────

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createSession(
  userId: number,
  options?: { ip?: string; userAgent?: string }
): Promise<string> {
  const token = generateSessionToken();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);

  await db.insert(schema.sessions).values({
    id: token,
    userId,
    expiresAt,
    createdIp: options?.ip,
    userAgent: options?.userAgent,
  });

  return token;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

/**
 * Reads the session cookie and validates it against the DB.
 * Returns null if the cookie is missing, expired, or the user is inactive.
 * Safe to call from Server Components, Server Actions, and layouts.
 */
export async function getSession(): Promise<AdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const now = new Date();

  const [row] = await db
    .select({
      sessionId: schema.sessions.id,
      expiresAt: schema.sessions.expiresAt,
      createdAt: schema.sessions.createdAt,
      userId: schema.users.id,
      email: schema.users.email,
      role: schema.users.role,
      displayName: schema.users.displayName,
      isActive: schema.users.isActive,
      totpEnabled: schema.users.totpEnabled,
    })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.users.id, schema.sessions.userId))
    .where(
      and(
        eq(schema.sessions.id, token),
        gt(schema.sessions.expiresAt, now)
      )
    )
    .limit(1);

  if (!row || !row.isActive) return null;

  // Sliding renewal: extend the cookie (and DB expiry) if within renew window
  const ageMs = now.getTime() - row.createdAt.getTime();
  const ageSec = ageMs / 1000;
  if (ageSec > SESSION_RENEW_THRESHOLD_SECONDS) {
    const newExpiry = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
    await db
      .update(schema.sessions)
      .set({ expiresAt: newExpiry })
      .where(eq(schema.sessions.id, token));
  }

  return {
    sessionId: row.sessionId,
    expiresAt: row.expiresAt,
    user: {
      id: row.userId,
      email: row.email,
      role: row.role as "admin" | "editor",
      displayName: row.displayName,
      isActive: row.isActive,
      totpEnabled: row.totpEnabled,
    },
  };
}

// ─── Set cookie ───────────────────────────────────────────────────────────────

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: true, // __Host- requires Secure
    sameSite: "lax",
    path: "/", // __Host- requires Path=/
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

// ─── Delete / logout ──────────────────────────────────────────────────────────

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await db.delete(schema.sessions).where(eq(schema.sessions.id, token));
    cookieStore.delete(SESSION_COOKIE);
  }
}
