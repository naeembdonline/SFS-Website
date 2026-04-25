# 02 — Architecture

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | **Next.js 16.2.4** (Turbopack) | `cacheComponents: true` — all routes dynamic by default |
| Language | TypeScript (strict) | |
| Database | **PostgreSQL** via **Neon** (serverless) | |
| ORM | **Drizzle ORM** | Schema-first; migrations in `lib/db/migrations/` |
| File storage | **Cloudflare R2** | Public bucket (CDN-served) + private bucket (upload staging) |
| Email | **Resend** | Transactional only (password reset, contact notifications) |
| Bot protection | **Cloudflare Turnstile** | Contact form only |
| Auth | Custom (no Auth.js) | Session table + bcryptjs (cost 12) + TOTP via `notp` |
| Styling | **Tailwind CSS v4** | CSS custom properties for brand tokens |
| Deployment | **Cloudflare Pages** | Built via `@cloudflare/next-on-pages`; middleware runs as edge function (`proxy.ts`) |

---

## Folder Structure

```
app/
  (admin)/admin/          # Admin panel — all routes under /admin
    layout.tsx            # Sets lang/dir, robots:noindex
    login/                # /admin/login — outside shell, no auth guard
    forgot-password/      # /admin/forgot-password — standalone
    password-reset/       # /admin/password-reset?token= — standalone
    totp-challenge/       # /admin/totp-challenge — standalone, pending-2FA only
    account/2fa/setup/    # /admin/account/2fa/setup — standalone, requires session
    (shell)/              # Authenticated shell (sidebar + topbar)
      layout.tsx          # Auth guard + TOTP enforcement → redirects to setup
      page.tsx            # Dashboard
      posts/              # /admin/posts CRUD
      campaigns/          # /admin/campaigns CRUD
      resources/          # /admin/resources CRUD
      leadership/         # /admin/leadership CRUD
      submissions/        # /admin/submissions (read-only)
      media/              # /admin/media
      settings/           # /admin/settings
      navigation/         # /admin/navigation
      account/password/   # /admin/account/password (stub)
      users/              # /admin/users (stub — P1)
      audit/              # /admin/audit (stub — P2)
      pages/              # /admin/pages (stub — P1)

  (public)/[locale]/      # Public site — all routes prefixed /{locale}
    layout.tsx            # Sets lang + dir (RTL for ar), loads font
    page.tsx              # Homepage
    blog/[slug]/          # Blog detail
    news/[slug]/          # News detail
    campaigns/[slug]/     # Campaign detail
    resources/[slug]/     # Resource detail
    leadership/           # Leadership list
    about/ contact/ privacy/ terms/
    [...path]/            # CMS catch-all for pages table

  api/
    admin/media/sign/     # R2 presigned upload URL (POST)
    admin/media/commit/   # Commit uploaded media to DB (POST)
    cron/retention/       # Data retention sweep (GET, CRON_SECRET required)
    submissions/          # Public contact/advisory form endpoint (POST)

lib/
  actions/                # Server Actions ("use server")
    auth.ts               # loginAction, logoutAction
    password-reset.ts     # requestPasswordResetAction, resetPasswordAction
    totp.ts               # generateTotpSecretAction, enableTotpAction, verifyTotpChallengeAction
    posts.ts / campaigns.ts / resources.ts / leadership.ts / media.ts / settings.ts / submissions.ts
  auth/
    session.ts            # createSession, getSession, setSessionCookie, deleteSession
    totp.ts               # AES-256-GCM encrypt/decrypt, base32, verifyTotpCode, recovery codes
    with-admin.ts         # withAdmin() guard — wraps Server Actions with session + role check
  audit.ts                # writeAuditLog() — always called inside a DB transaction
  db/
    index.ts              # Drizzle db instance
    schema/               # One file per domain: auth, content, media, infrastructure, settings
    migrations/           # SQL migration files
  env.ts                  # Runtime env validation (skipped at build time)
  i18n/
    config.ts             # locales, defaultLocale, rtlLocales, isRtl()
    dict.ts               # getDictionary(locale) — static UI strings
  seo/
    metadata.ts           # buildMetadata() — generates Next.js Metadata with hreflang
    json-ld.ts            # articleJsonLd, campaignJsonLd, breadcrumbJsonLd

components/
  admin/
    auth/                 # LoginForm, TotpSetupForm, TotpChallengeForm, ForgotPasswordForm, ResetPasswordForm
    shell/                # Sidebar, Topbar
    editor/               # Rich-text editor (client component)
  public/
    prose.tsx             # Renders sanitized HTML body content
    not-translated.tsx    # 200 + notice when content unavailable in requested locale
  ui/
    container.tsx         # Max-width layout wrapper

proxy.ts                  # Next.js middleware (renamed from middleware.ts in Next.js 16)
```

---

## Caching Model

Next.js 16 with `cacheComponents: true` makes **all routes dynamic by default**. Static data is opted in explicitly.

| Pattern | Used for |
|---|---|
| `"use cache"` + `cacheTag(...)` at top of data function | All public read functions in `lib/data/public/` |
| No `"use cache"` | All admin data functions — never cached |
| `export const dynamic = ...` | **Forbidden** — not available in Next.js 16 |
| `revalidateTag(tag)` | Called in Server Actions after mutations to bust cache |

Cache tags follow the pattern `resource-slug-{locale}-{slug}`, `resources-{locale}`, `resources`, etc.

---

## Import Boundaries

These are **strictly enforced** — violations cause runtime import errors or security leaks.

| Boundary | Rule |
|---|---|
| `lib/data/public/*` | Only imported from public routes (`app/(public)/`) and public API routes |
| `lib/data/admin/*` | Only imported from admin routes (`app/(admin)/`) |
| `"use client"` allowlist | `components/admin/auth/*`, `components/admin/editor/*`, analytics, submission-form, language-switcher, mobile-menu, error boundaries only |
| `lib/actions/*` | All files must have `"use server"` at the top |
| `lib/auth/*` | Only imported server-side |

---

## Multilingual Strategy

### URL Structure
- Locale prefix always present: `/bn/...`, `/en/...`, `/ar/...`
- Root `/` redirects to `/{defaultLocale}` (or `locale_pref` cookie value)
- `proxy.ts` sets `x-locale` request header for the root layout

### Content Model
- **UI chrome** (nav labels, buttons, error messages): static JSON dictionaries in `lib/i18n/dict.ts`, one per locale
- **Editorial content** (posts, campaigns, resources, pages, leadership): database-driven with per-locale `*_translations` rows
- **No machine translation** at any layer — ever

### Missing-Translation Fallback
When a content item has no published translation for the requested locale:
1. A two-step DB query finds the entity by slug in any locale, then returns all published `(locale, slug)` pairs
2. `NotTranslated` component renders a 200 response with a notice and links to available locales
3. **Never** auto-translate, **never** silently show wrong-locale text

### RTL Support
- Arabic (`ar`) uses `dir="rtl"` set on the root layout element
- Tailwind uses logical properties (`ps-`, `pe-`, `ms-`, `me-`) throughout
- `isRtl(locale)` from `lib/i18n/config.ts` controls conditional class application

### SEO
- `buildMetadata()` generates `alternates.languages` with hreflang for all 3 locales + `x-default → /bn`
- Each translation has independent `seoTitle`, `metaDescription`, `ogTitle`, `ogDescription`, `ogImageId`
- Canonical URL is locale-prefixed

---

## Middleware (`proxy.ts`)

Runs on every request. Responsibilities:

1. **Security headers** — applied to all responses (see `docs/04_SECURITY.md`)
2. **Pending-2FA redirect** — if `__Host-admin-2fa-pending` cookie present on an admin route (not challenge/login/setup), redirect to `/admin/totp-challenge`
3. **Locale routing** — root `/` → `/{locale}`, sets `x-locale` header on all other routes
4. TOTP enrollment enforcement (redirect to `/admin/account/2fa/setup` if not enrolled) is done in the shell layout, not middleware, because it requires a DB query
