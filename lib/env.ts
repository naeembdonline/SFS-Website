/**
 * Environment variable verification.
 *
 * Two-tier validation:
 *   - REQUIRED: must be set or app refuses to boot
 *   - CONDITIONAL: required only when a related feature is enabled
 *
 * Build-time skip: only fires at runtime (first server boot), not during `next build`.
 */

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "AUTH_SECRET",
  "TOTP_ENCRYPTION_KEY",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_PUBLIC",
  "R2_BUCKET_PRIVATE",
  "R2_PUBLIC_URL",
  "EMAIL_FROM",
  "EMAIL_STAFF_INBOX",
  "CRON_SECRET",
] as const;

interface ValidationIssue {
  key: string;
  reason: string;
}

function checkConditional(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const provider = process.env.EMAIL_PROVIDER ??
    (process.env.RESEND_API_KEY ? "resend" : "smtp");

  if (provider === "resend" && !process.env.RESEND_API_KEY) {
    issues.push({ key: "RESEND_API_KEY", reason: "EMAIL_PROVIDER=resend" });
  }
  if (provider === "smtp" && !process.env.SMTP_HOST) {
    issues.push({ key: "SMTP_HOST", reason: "EMAIL_PROVIDER=smtp" });
  }

  // Storage: VPS (MinIO) requires R2_ENDPOINT, Cloudflare R2 requires R2_ACCOUNT_ID
  if (!process.env.R2_ENDPOINT && !process.env.R2_ACCOUNT_ID) {
    issues.push({
      key: "R2_ENDPOINT or R2_ACCOUNT_ID",
      reason: "Either MinIO endpoint or Cloudflare R2 account ID required",
    });
  }

  // Turnstile: required only if site key is exposed publicly
  if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !process.env.TURNSTILE_SECRET_KEY) {
    issues.push({
      key: "TURNSTILE_SECRET_KEY",
      reason: "NEXT_PUBLIC_TURNSTILE_SITE_KEY is set",
    });
  }

  return issues;
}

function checkSecretStrength(): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const minLen = 32;

  for (const key of ["AUTH_SECRET", "TOTP_ENCRYPTION_KEY", "CRON_SECRET"]) {
    const value = process.env[key];
    if (value && value.length < minLen) {
      issues.push({
        key,
        reason: `must be at least ${minLen} characters (current: ${value.length})`,
      });
    }
  }

  // Common bad values
  const badValues = ["secret", "password", "changeme", "default", "test", "dummy"];
  for (const key of REQUIRED_ENV_VARS) {
    const value = process.env[key]?.toLowerCase();
    if (value && badValues.includes(value)) {
      issues.push({ key, reason: `looks like a placeholder ("${value}")` });
    }
  }

  return issues;
}

export function validateEnv(): void {
  if (process.env.NEXT_PHASE === "phase-production-build") return;

  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  const conditional = checkConditional();
  const weak = checkSecretStrength();

  const errors: string[] = [];
  if (missing.length > 0) {
    errors.push(`Missing required: ${missing.join(", ")}`);
  }
  for (const issue of conditional) {
    errors.push(`Missing ${issue.key} (${issue.reason})`);
  }
  for (const issue of weak) {
    errors.push(`Weak ${issue.key}: ${issue.reason}`);
  }

  if (errors.length > 0) {
    throw new Error(
      `Environment validation failed:\n  - ${errors.join("\n  - ")}\n` +
        `Generate strong secrets with: openssl rand -hex 32`
    );
  }
}

validateEnv();
