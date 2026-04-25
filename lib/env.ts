/**
 * Environment variable verification.
 * This module ensures required variables are present at runtime.
 *
 * Variables are grouped by concern for readability.
 * Add new required vars here — the build-time skip means this only fires
 * when the server actually boots, catching missing config before first request.
 */

const REQUIRED_ENV_VARS = [
  // ─── Database ───────────────────────────────────────────────────────────────
  "DATABASE_URL",

  // ─── Auth ───────────────────────────────────────────────────────────────────
  "AUTH_SECRET",           // 32-byte hex string; used for session token signing
  "TOTP_ENCRYPTION_KEY",   // 32-byte hex string; AES-256-GCM key for TOTP secrets

  // ─── Storage (Cloudflare R2) ────────────────────────────────────────────────
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_PUBLIC",      // public media bucket name
  "R2_BUCKET_PRIVATE",     // private/upload staging bucket name
  "R2_PUBLIC_URL",         // CDN base URL, e.g. https://media.example.com

  // ─── Email (Resend) ─────────────────────────────────────────────────────────
  "RESEND_API_KEY",
  "EMAIL_FROM",            // From address for transactional email, e.g. noreply@example.com
  "EMAIL_STAFF_INBOX",     // Staff-facing inbox for contact form notifications

  // ─── Integrations ───────────────────────────────────────────────────────────
  "TURNSTILE_SECRET_KEY",  // Cloudflare Turnstile (contact form bot protection)
  "CRON_SECRET",           // Bearer token checked by /api/cron/* routes
] as const;

export function validateEnv() {
  // Skip validation during build to allow 'next build' to succeed without secrets
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return;
  }

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
}

// Auto-validate on import
validateEnv();
