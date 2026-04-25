/**
 * TOTP crypto helpers.
 *
 * Secret lifecycle:
 *   1. generateTotpSecret()   → raw 20-byte Buffer + base32 string + otpauth URL
 *   2. encryptTotpSecret()    → AES-256-GCM Buffer stored in DB bytea column
 *   3. decryptTotpSecret()    → raw 20-byte Buffer for verification
 *
 * Encryption key: TOTP_ENCRYPTION_KEY env var — 32 random bytes, hex-encoded
 * (64 hex chars). Validated by lib/env.ts on startup.
 *
 * Verification: notp.totp.verify() accepts a raw key Buffer directly.
 *
 * Recovery codes:
 *   generateRecoveryCodes()   → 8 × "XXXXX-XXXXX" format
 *   hashRecoveryCode()        → SHA-256 hex
 *   compareRecoveryCodeHash() → timing-safe compare
 */

import {
  createCipheriv,
  createDecipheriv,
  createHash,
  timingSafeEqual,
} from "crypto";
import * as notp from "notp";

// ─── Key ──────────────────────────────────────────────────────────────────────

function getEncKey(): Buffer {
  const hex = process.env.TOTP_ENCRYPTION_KEY;
  if (!hex || hex.length !== 64) {
    throw new Error("TOTP_ENCRYPTION_KEY must be a 64-char hex string (32 bytes)");
  }
  return Buffer.from(hex, "hex");
}

// ─── Base32 (RFC 4648) — simple encoder, no dependency ───────────────────────

const B32_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

function base32Encode(buf: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = "";
  for (const byte of buf) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      output += B32_CHARS[(value >>> bits) & 0x1f];
    }
  }
  if (bits > 0) {
    output += B32_CHARS[(value << (5 - bits)) & 0x1f];
  }
  return output;
}

function base32Decode(str: string): Buffer {
  const s = str.toUpperCase().replace(/=+$/, "");
  let bits = 0;
  let value = 0;
  const output: number[] = [];
  for (const char of s) {
    const idx = B32_CHARS.indexOf(char);
    if (idx === -1) throw new Error(`Invalid base32 char: ${char}`);
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      output.push((value >>> bits) & 0xff);
    }
  }
  return Buffer.from(output);
}

// ─── Encrypt / Decrypt ────────────────────────────────────────────────────────

/** Encrypts the raw secret Buffer. Returns Buffer: [12-byte IV][ciphertext][16-byte auth tag] */
export function encryptTotpSecret(rawKeyBuf: Buffer): Buffer {
  const key = getEncKey();
  const iv = Buffer.from(crypto.getRandomValues(new Uint8Array(12)));
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([cipher.update(rawKeyBuf), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, ct, tag]);
}

/** Decrypts the buffer produced by encryptTotpSecret. Returns the raw key Buffer. */
export function decryptTotpSecret(encrypted: Buffer): Buffer {
  const key = getEncKey();
  const iv = encrypted.subarray(0, 12);
  const tag = encrypted.subarray(encrypted.length - 16);
  const ct = encrypted.subarray(12, encrypted.length - 16);
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(ct), decipher.final()]);
}

// ─── Secret generation ────────────────────────────────────────────────────────

export interface TotpSecretBundle {
  /** Raw 20-byte key Buffer (pass to encryptTotpSecret before storing) */
  keyBuf: Buffer;
  /** Base32 string — shown to user / QR code */
  secret: string;
  /** otpauth:// URI for QR code generation */
  otpauthUrl: string;
}

export function generateTotpSecret(
  email: string,
  issuer = "SFS Admin"
): TotpSecretBundle {
  const keyBuf = Buffer.from(crypto.getRandomValues(new Uint8Array(20)));
  const secret = base32Encode(keyBuf);
  const otpauthUrl =
    `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(email)}` +
    `?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;
  return { keyBuf, secret, otpauthUrl };
}

// ─── TOTP verification ────────────────────────────────────────────────────────

/**
 * Verifies a 6-digit TOTP code against a raw key Buffer.
 * notp.totp.verify accepts a Buffer/string key directly (not base32).
 * window:1 allows ±1 step (30 s each side) for clock skew.
 */
export function verifyTotpCode(keyBuf: Buffer, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  try {
    const result = notp.totp.verify(code, keyBuf, { window: 1 });
    return result !== null;
  } catch {
    return false;
  }
}

/**
 * Verifies a TOTP code given the base32 secret string (for the challenge path,
 * when we decrypt from DB and want to keep the base32 as an intermediate).
 */
export function verifyTotpCodeFromSecret(secret: string, code: string): boolean {
  try {
    const keyBuf = base32Decode(secret);
    return verifyTotpCode(keyBuf, code);
  } catch {
    return false;
  }
}

// ─── Recovery codes ───────────────────────────────────────────────────────────

const RECOVERY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars

export function generateRecoveryCodes(count = 8): string[] {
  return Array.from({ length: count }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(10));
    const chars = Array.from(bytes)
      .map((b) => RECOVERY_CHARS[b % RECOVERY_CHARS.length])
      .join("");
    return `${chars.slice(0, 5)}-${chars.slice(5)}`;
  });
}

export function hashRecoveryCode(code: string): string {
  return createHash("sha256")
    .update(code.replace(/-/g, "").toUpperCase())
    .digest("hex");
}

export function compareRecoveryCodeHash(rawCode: string, storedHash: string): boolean {
  const candidate = hashRecoveryCode(rawCode);
  try {
    return timingSafeEqual(
      Buffer.from(candidate, "hex"),
      Buffer.from(storedHash, "hex")
    );
  } catch {
    return false;
  }
}
