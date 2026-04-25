# 04 — Security

## Authentication Flow

### Login
1. `loginAction` validates email + password (Argon2id)
2. IP rate limit checked: 20 requests / 15 min
3. Account lockout checked: locked if `locked_until > now`
4. Password verify: fail-closed (any error = invalid)
5. On wrong password: increment `failed_login_count`; lock account for 15 min at threshold 5
6. If `totp_enabled = true`: set `__Host-admin-2fa-pending` cookie (HMAC-signed, 5-min TTL) → redirect to `/admin/totp-challenge`
7. If `totp_enabled = false`: create session → redirect to `/admin` (but shell layout will immediately redirect to TOTP setup)
8. All attempts (success and fail) written to `audit_log`

### TOTP 2FA (Mandatory)
- **Enrollment is mandatory** — the shell layout redirects any authenticated user with `totp_enabled = false` to `/admin/account/2fa/setup` before rendering any page
- Setup page: server generates QR code (via `qrcode` package) + base32 secret; user scans and verifies one code; on success 8 recovery codes are generated and shown once
- Secret stored: AES-256-GCM encrypted, key = `TOTP_ENCRYPTION_KEY` env var (32-byte hex)
- Recovery codes: stored as SHA-256 hashes; each single-use; 8 per enrollment
- Challenge page (`/admin/totp-challenge`): accepts 6-digit TOTP code or `XXXXX-XXXXX` recovery code
- Pending state: `__Host-admin-2fa-pending` cookie (value = `{userId}:{HMAC-SHA256}`, 5-min TTL)

### Sessions
- Token: 32 random bytes → 64-char hex
- Stored raw in `sessions.id` (text PK)
- Cookie: `__Host-admin-sess` (httpOnly, Secure, SameSite=Lax, Path=/)
- Duration: 8 hours sliding (renewed if session > 4 h old)
- On password reset: **all sessions for the user are deleted** (force re-login everywhere)
- On logout: session deleted from DB + cookie cleared

### Password Reset
1. `requestPasswordResetAction`: accepts email; rate-limited (3 req / 15 min / IP); always returns generic success (no enumeration); invalidates existing unused tokens; generates 32-byte hex token; stores only SHA-256 hash; sends link via Resend; expires in 1 hour
2. `resetPasswordAction`: validates token (hash lookup, not expired, not used); re-hashes password with Argon2id; marks token used; deletes all sessions; writes audit log; redirects to `/admin/login?reset=1`

---

## Role-Based Access Control (RBAC)

| Role | Capabilities |
|---|---|
| `admin` | All CRUD, user management, site settings, TOTP disable |
| `editor` | Content CRUD (posts, campaigns, resources, leadership), media upload, submissions view |

The `withAdmin()` guard in `lib/auth/with-admin.ts` wraps all Server Actions:
- No options → requires `editor` or `admin`
- `{ role: "admin" }` → requires `admin` only

Unauthorized calls return `{ ok: false, error: "...", code: "FORBIDDEN" }` — never throw to the client.

---

## Audit Log

**Rule**: `writeAuditLog()` **must** be called inside the same DB transaction as the mutation. If the audit write fails, the transaction rolls back (fail-closed).

**Actions logged** (non-exhaustive):

| Action | Trigger |
|---|---|
| `auth.login.success` / `.failed` | Every login attempt |
| `auth.totp.enabled` / `.disabled` | TOTP enrollment changes |
| `auth.totp.challenge.success` / `.failed` | 2FA challenge outcomes |
| `auth.password_reset.requested` / `.completed` | Password reset flow |
| `post.create` / `.update` / `.delete` | Content mutations |
| `campaign.create` / `.update` / `.delete` | " |
| `resource.create` / `.update` / `.delete` | " |
| `leadership.create` / `.update` / `.delete` | " |
| `media.upload` | File uploads |

**Redaction rule** — `diff` field must **never** contain:
- `password_hash`
- `totp_secret_encrypted`
- `code_hash` (recovery codes)
- Any raw token value

---

## Security Headers

Set in `proxy.ts` (middleware), applied to **every response**.

### All environments
| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `DENY` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()` |

### Production only
| Header | Value |
|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `Content-Security-Policy` | See below |

### CSP (production)
```
default-src 'self';
script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com;
style-src 'self' 'unsafe-inline';
img-src 'self' data: blob: https://*.r2.cloudflarestorage.com;
font-src 'self';
connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com;
frame-src https://challenges.cloudflare.com;
frame-ancestors 'none';
object-src 'none';
base-uri 'self';
form-action 'self';
upgrade-insecure-requests
```

`'unsafe-inline'` in `script-src` is an interim measure required for JSON-LD `<script>` blocks rendered via `dangerouslySetInnerHTML`. **TODO Phase 23**: replace with per-request nonces.

**Why headers are in `proxy.ts` not `next.config.ts`**: webpack's dev server HMR uses `eval()`. If CSP were in `next.config.ts`, it would apply in development too and break HMR (blank page). Middleware skips CSP in development via `isProd` check.

---

## Rate Limiting

All rate limiting uses the `rate_limits` table (sliding window, per-minute buckets).

| Endpoint | Bucket | Window | Limit |
|---|---|---|---|
| Login | `login:ip:{ip}` | 15 min | 20 |
| Password reset request | `pwd-reset:ip:{ip}` | 15 min | 3 |
| Contact/advisory submission | `submission:ip:{ip}` | 15 min | (set in submissions action) |

---

## Data Retention

`/api/cron/retention` (requires `Authorization: Bearer {CRON_SECRET}` header):
- Nulls `ip` and `user_agent` on `submissions` rows older than 90 days
- Cleans up expired `rate_limits` windows
- Should be called daily by an external cron (e.g. Cloudflare Workers Cron Trigger)

---

## Environment Secrets

All required env vars are validated at runtime startup by `lib/env.ts` (skipped during `next build`):

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon PostgreSQL connection string |
| `AUTH_SECRET` | 32-byte hex; session signing |
| `TOTP_ENCRYPTION_KEY` | 32-byte hex; AES-256-GCM key for TOTP secrets |
| `R2_ACCESS_KEY_ID` | Cloudflare R2 API key |
| `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API secret |
| `R2_BUCKET_PUBLIC` | Public media bucket name |
| `R2_BUCKET_PRIVATE` | Private upload staging bucket name |
| `R2_PUBLIC_URL` | CDN base URL for public media |
| `RESEND_API_KEY` | Resend transactional email |
| `EMAIL_FROM` | From address for outbound email |
| `EMAIL_STAFF_INBOX` | Staff inbox for contact form notifications |
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret |
| `CRON_SECRET` | Bearer token for cron route authentication |
| `NEXT_PUBLIC_SITE_URL` | Public site URL (not validated, but used in email links and JSON-LD) |
