/**
 * Centralised password hashing and verification.
 *
 * Uses bcryptjs — pure JavaScript, zero native addons — so it runs in any
 * JS environment including Cloudflare Workers/Pages without nodejs_compat.
 *
 * Cost factor 12 meets OWASP bcrypt recommendations (≥ 10).
 *
 * Usage:
 *   const hash = await hashPassword(plaintext);
 *   const ok   = await verifyPassword(plaintext, hash);
 */

import bcrypt from "bcryptjs";

const COST_FACTOR = 12;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, COST_FACTOR);
}

/**
 * Constant-time comparison via bcryptjs.compare.
 * Returns false (never throws) on any error.
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}
