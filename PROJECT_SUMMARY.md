# PROJECT SUMMARY — Sovereignty Website

**Last updated:** Production-ready launch build complete (2026-04-23)
**Status:** Production Ready — all phases 1–25 and all launch tasks complete.
**Purpose:** Source of truth for all developers and AI agents working on this project. Read this file in full before writing any code.

---

## Table of Contents

1. [Project Identity & Goals](#1-project-identity--goals)
2. [Tech Stack](#2-tech-stack)
3. [Folder Structure & Import Boundaries](#3-folder-structure--import-boundaries)
4. [Database Schema](#4-database-schema)
5. [Multilingual & RTL Strategy](#5-multilingual--rtl-strategy)
6. [Security & Auth Rules](#6-security--auth-rules)
7. [Admin System](#7-admin-system)
8. [Design System](#8-design-system)
9. [Route Map](#9-route-map)
10. [Environment Variables](#10-environment-variables)
11. [Build Progress](#11-build-progress)
12. [Critical Next.js 16 Patterns](#12-critical-nextjs-16-patterns)
13. [Rules for AI Agents](#13-rules-for-ai-agents)

---

## 1. Project Identity & Goals

**Students for Sovereignty (স্টুডেন্টস ফর সভরেন্টি)** is a student-led trilingual civic/advocacy organization in Bangladesh, founded on August 28, 2024. This platform serves as the organization's primary public face, communicating its mission for a sovereign, secure, and self-reliant state free from foreign hegemony.

Public-facing editorial site — content, campaigns, resources, leadership. No user accounts on the public side. Staff-only admin CMS.

### Current Status

**Production Ready.** The public site, staff admin CMS, security hardening, SEO layer, health endpoint, audit log viewer, admin toasts, editor autosave, and final production checks are complete.

Latest verification:
- `npx tsc --noEmit` → passed
- `npm run build` → passed
- `npm run lint` → passed in final polish pass

### Priority order (in case of conflict)
1. Functionality
2. Readability and clarity
3. UX quality
4. Performance
5. Security
6. SEO / AEO / GEO
7. Visual polish
8. Engineering elegance

### Core constraints
- Fast, secure, trilingual (BN / EN / AR) from day  one
- All editorial content editable from admin — no hardcoded copy
- Manually authored per language — **no auto-translation, ever**
- Strong security posture (politically sensitive organization)
- Premium, restrained visual identity

---

## 2. Tech Stack

| Layer | Technology | Version | Notes |
|---|---|---|---|
| Framework | Next.js (App Router) | 16.2.4 | `cacheComponents: true` — read §12 before writing any route |
| Language | TypeScript (strict) | 5.x | |
| Styling | Tailwind CSS | v4 | CSS-native `@theme`; global CSS lives in `app/globals.css` and `styles/globals.css` |
| ORM | Drizzle ORM | 0.45.2 | Schema in `lib/db/schema/`; migrations in `lib/db/migrations/` |
| Database | Neon Postgres (serverless) | — | `@neondatabase/serverless` neon-http driver |
| Auth | Custom admin sessions | — | HttpOnly DB-backed sessions in `sessions`; custom credential login, TOTP, recovery codes |
| Password hashing | bcryptjs | — | Pure-JS bcrypt, cost factor 12; edge-compatible (no native addons) |
| File Storage | Cloudflare R2 | — | Public bucket (CDN images) + private bucket (docs/PDFs) |
| CDN / WAF | Cloudflare | — | DDoS, bot protection, rate-limit assist at edge |
| Email | Resend | — | Transactional only (password reset, notifications) |
| CAPTCHA | Cloudflare Turnstile | — | Public submission forms |
| Analytics | Cloudflare Web Analytics | — | Cookieless; no consent banner required |
| Hosting | Cloudflare Pages | — | Built with `@cloudflare/next-on-pages`; env vars set in CF Pages dashboard |
| Middleware | `proxy.ts` | — | **Next.js 16 renamed** `middleware.ts` → `proxy.ts` |
| Cache | Next.js `'use cache'` | — | Replaces deprecated `unstable_cache`; `cacheTag()` for on-demand invalidation |

### High-level request flow

```
Browser
  → Cloudflare WAF / CDN
    → Cloudflare Pages Edge (proxy.ts)
      → Next.js App Router
          ├─ Static shell (pre-rendered at build — locale layout with Header/Footer)
          └─ Suspense boundary → async Server Component
               ├─ 'use cache' data function (Neon DB query, stored in Next.js Data Cache)
               └─ revalidateTag() called by admin Server Actions to bust cache on publish
```

---

## 3. Folder Structure & Import Boundaries

```
F:\Task\SFS\
├── app/
│   ├── layout.tsx                      # Root layout — static; sets lang="bn" default; NO headers()/cookies()
│   ├── page.tsx                        # Root redirect → /bn
│   ├── not-found.tsx                   # Global 404 fallback
│   ├── (public)/
│   │   └── [locale]/
│   │       ├── layout.tsx              # ← generateStaticParams() returns bn/en/ar (the ONLY place)
│   │       │                           #   Validates locale, sets lang/dir on wrapper div, loads dict
│   │       ├── page.tsx                # Homepage
│   │       ├── about/page.tsx
│   │       ├── leadership/page.tsx
│   │       ├── news/
│   │       │   ├── page.tsx            # News list
│   │       │   └── [slug]/page.tsx     # ← Suspense-wrapper pattern (see §12)
│   │       ├── blog/
│   │       │   ├── page.tsx
│   │       │   └── [slug]/page.tsx     # ← Suspense-wrapper pattern
│   │       ├── campaigns/
│   │       │   ├── page.tsx
│   │       │   └── [slug]/page.tsx     # ← Suspense-wrapper pattern
│   │       ├── resources/page.tsx
│   │       ├── contact/page.tsx
│   │       ├── privacy/page.tsx
│   │       ├── terms/page.tsx
│   │       ├── not-found.tsx           # Locale-aware 404 with "Go home" link
│   │       └── [...path]/page.tsx      # ← Slug redirect catch-all; Suspense-wrapper pattern
│   ├── (admin)/
│   │   └── admin/
│   │       ├── layout.tsx              # Admin shell — auth guard (Phase 15)
│   │       └── login/page.tsx          # Login + TOTP 2FA
│   └── api/
│       ├── admin/media/sign|commit/    # R2 sign/commit pipeline
│       ├── cron/retention/             # IP nulling, session sweep (Phase 22)
│       └── health/                     # Uptime ping
│
├── components/
│   ├── ui/                             # Generic primitives: Button, Container, Input …
│   ├── public/                         # Public-only: Prose, NotTranslated, PostCard,
│   │                                   #   CampaignCard, ResourceItem, LeadershipCard, SectionHeader
│   ├── shell/                          # Header, Footer, SkipLink, LanguageSwitcher*, MobileMenu*
│   └── admin/                          # Admin-only components (Phase 16+)
│
├── lib/
│   ├── i18n/
│   │   ├── config.ts                   # locales, defaultLocale, isRtl(), isValidLocale()
│   │   ├── dict.ts                     # getDictionary(locale) — loads JSON, returns Dictionary
│   │   └── dictionaries/               # bn.json, en.json, ar.json — UI chrome only
│   ├── db/
│   │   ├── index.ts                    # Drizzle client singleton (server-only)
│   │   ├── schema/                     # See §4 for table inventory
│   │   │   ├── _enums.ts, _types.ts
│   │   │   ├── auth.ts, media.ts, content.ts, settings.ts, infrastructure.ts
│   │   │   └── index.ts
│   │   ├── migrations/                 # Drizzle-kit generated SQL
│   │   └── seed.ts                     # Dev-only seed script (idempotent)
│   ├── data/
│   │   ├── public/                     # ← ONLY imported from (public) routes
│   │   │   ├── settings.ts             # getSiteSettings, getNavItems
│   │   │   ├── posts.ts                # getPostList, getPostBySlug
│   │   │   ├── campaigns.ts            # getCampaignList, getCampaignBySlug
│   │   │   ├── resources.ts            # getResourceList
│   │   │   ├── leadership.ts           # getLeadershipMembers
│   │   │   └── pages.ts                # getPage (home/about/contact/privacy/terms)
│   │   └── admin/                      # ← ONLY imported from (admin) routes (Phase 15+)
│   ├── seo/
│   │   ├── metadata.ts                 # buildMetadata() — canonical, hreflang, OG, Twitter
│   │   └── json-ld.ts                  # organizationJsonLd, articleJsonLd, campaignJsonLd, breadcrumbJsonLd
│   ├── auth/                           # Custom session helpers and withAdmin guard
│   ├── validation/                     # Zod schemas for admin mutations (Phase 17)
│   └── fonts.ts                        # next/font: Hind Siliguri, Inter, Noto Naskh Arabic
│
├── styles/
│   └── globals.css                     # Tailwind v4 @theme block — ALL design tokens live here
│
├── proxy.ts                            # Next.js 16 middleware (renamed from middleware.ts)
├── next.config.ts                      # cacheComponents: true
├── drizzle.config.ts
└── PROJECT_SUMMARY.md                  # This file
```

`* = "use client"` — everything else is Server Components by default.

### Import Boundary Rules — ENFORCED

| Rule | Reason |
|---|---|
| `lib/data/public/*` never imported from `(admin)` routes | Public queries bypass draft data; mixing exposes drafts |
| `lib/data/admin/*` never imported from `(public)` routes | Admin queries expose unpublished content and PII |
| `proxy.ts` never imports from `lib/db` or `lib/auth/totp` | Middleware runs on edge runtime; Node-only modules crash it |
| `'use cache'` functions never call `revalidateTag()` | Tags are read-only cache keys; invalidation lives in Server Actions |
| Admin Server Actions always write to `audit_log` in same transaction | Fail-closed: if audit write fails, the mutation rolls back |
| `lib/db/schema/*` never imports from `lib/data/*` | Schema = definitions only; no circular deps |

---

## 4. Database Schema

**Total: 26 tables, 10 enums.** All defined in `lib/db/schema/`. Do not create new tables without explicit instruction and a schema review.

### Enums (`lib/db/schema/_enums.ts`)

| Enum | Values |
|---|---|
| `locale_t` | `bn`, `en`, `ar` |
| `content_status` | `draft`, `published` |
| `user_role` | `admin`, `editor` |
| `post_type` | `blog`, `news` |
| `resource_kind` | `pdf`, `link`, `doc` |
| `campaign_lifecycle` | `active`, `past` |
| `submission_kind` | `contact`, `advisory` |
| `submission_status` | `new`, `reviewed`, `handled`, `archived` |
| `nav_menu` | `header`, `footer` |
| `nav_link_kind` | `route`, `external` |

### Custom Column Types (`lib/db/schema/_types.ts`)

| Type | Postgres type | Usage |
|---|---|---|
| `citext` | case-insensitive text | `users.email` — login comparison is case-insensitive |
| `inet` | inet | IP addresses in `sessions`, `submissions`, `audit_log` |
| `bytea` | raw bytes | `users.totp_secret_encrypted` (AES-256-GCM) |

### Schema Files

#### `auth.ts` — 4 tables

| Table | Key columns | Notes |
|---|---|---|
| `users` | `email` (citext unique), `password_hash`, `role`, `is_active`, `totp_enabled`, `totp_secret_encrypted` (bytea), `locked_until` | Never hard-deleted; `is_active = false` = deactivated |
| `sessions` | `id` (text PK), `user_id`, `expires_at`, `created_ip` | Custom DB-backed admin session strategy |
| `password_reset_tokens` | `token_hash` (unique, only hash stored), `user_id`, `expires_at`, `used_at` | Single-use, 60-min TTL |
| `totp_recovery_codes` | `user_id`, `code_hash` (Argon2id), `used_at` | 10 codes generated at enrollment |

#### `media.ts` — 2 tables

| Table | Key columns | Notes |
|---|---|---|
| `media` | `storage_key` (UUID-based, unique), `bucket`, `mime` (server-sniffed), `bytes`, `variants` (JSONB) | Hard-delete with confirm |
| `media_translations` | `(media_id, locale)` unique | Alt text + caption per locale |

#### `content.ts` — 10 tables

Every content entity follows **parent + translations pattern**:

| Parent | Translation | Discriminator / Notes |
|---|---|---|
| `posts` | `post_translations` | `type`: `blog` \| `news` |
| `pages` | `page_translations` | `key`: `home`, `about`, `contact`, `privacy`, `terms`; `sections` (JSONB) |
| `campaigns` | `campaign_translations` | `status_lifecycle`: `active` \| `past`; has `goals` text field |
| `resources` | `resource_translations` | `kind`: `pdf` \| `link` \| `doc` |
| `leadership` | `leadership_translations` | No slug — index-only page in MVP; no detail pages |

All translation tables: `(entity_id, locale)` unique, `status`, `published_at`, `seo_title`, `meta_description`, `og_title`, `og_description`, `og_image_id`.  
All content parent tables: `deleted_at` (soft-delete), `first_published_at`.

#### `settings.ts` — 4 tables

| Table | Notes |
|---|---|
| `navigation_items` | `menu` (header\|footer), `link_kind` (route\|external); DB `CHECK` constraint: exactly one of `route_key` / `external_url` must be set |
| `navigation_item_translations` | `(item_id, locale)` unique; `label` only |
| `site_settings` | **Singleton** — `CHECK (id = 1)`, `id DEFAULT 1`; `socials` (JSONB array) |
| `site_settings_translations` | `locale` unique — one row per locale |

#### `infrastructure.ts` — 5 tables

| Table | Notes |
|---|---|
| `submissions` | `kind` (contact\|advisory), status lifecycle, `ip` (inet) — nulled after 90 days by retention cron; never deleted |
| `rate_limits` | `(bucket, window_start)` unique — Postgres-backed sliding window; buckets: `login:ip:<ip>`, `submission:ip:<ip>` |
| `slug_reservations` | **Global slug namespace guard** — `(entity_type, locale, slug)` unique; must insert before any slug save |
| `slug_redirects` | `(entity_type, locale, old_slug)` unique; **no FK** (survives soft-delete); resolved by `[...path]` catch-all |
| `audit_log` | Append-only, immutable; written in same transaction as every admin mutation; `diff` JSONB never contains passwords/TOTP |

### Key Design Decisions

**Slug uniqueness** is enforced globally via `slug_reservations`, not per-translation-table. Before any `INSERT` or `UPDATE` to a `*_translations.slug` column, insert `(entity_type, locale, slug, entity_id)` into `slug_reservations`. The unique index prevents collisions across all content types even after content is deleted.

**Slug changes on published content**: write a `slug_redirects` row for the old slug + update the `slug_reservations` row in the same transaction. The catch-all route resolves old slugs → current URL and returns HTTP 301.

**Audit log** is append-only and fail-closed: if the `audit_log` INSERT fails, the entire mutation transaction rolls back. The `diff` field must never contain `password_hash`, `totp_secret_encrypted`, `code_hash`, or any raw token.

---

## 5. Multilingual & RTL Strategy

### Locales

| Code | Language | Font | Direction | Default? |
|---|---|---|---|---|
| `bn` | Bangla | Hind Siliguri | LTR | **Yes** |
| `en` | English | Inter | LTR | No |
| `ar` | Arabic | Noto Naskh Arabic | RTL | No |

### URL Structure

All URLs are locale-prefixed. There is NO content at the unprefixed root.

```
/            → 302/307 redirect to /bn (see app/page.tsx and proxy.ts)
/bn/about    → About in Bangla
/en/about    → About in English
/ar/about    → About in Arabic
```

Invalid locale segment → 404 (handled in `[locale]/layout.tsx`).

### Two-Layer i18n

**Layer 1 — Static UI chrome** (nav labels, button text, form labels, error messages, system strings):
- JSON files: `lib/i18n/dictionaries/bn.json`, `en.json`, `ar.json`
- Loaded server-side by `getDictionary(locale)` — zero client bundle impact
- Type-checked via `Dictionary` type in `lib/i18n/dict.ts`
- Changed by developers via code; does NOT go through the admin CMS

**Layer 2 — Editorial content** (titles, slugs, body text, SEO fields):
- Stored in `*_translations` DB tables, one row per (entity, locale)
- Managed by editors via the admin CMS (Phase 17)
- Each translation has its own: slug, title, body, SEO fields, `publishedAt`

**NEVER mix these two layers.**

### Missing Translation Fallback Policy

When content is not published in the requested locale:

1. Page returns HTTP **200** (not 404)
2. A `<NotTranslated>` notice is shown (`components/public/not-translated.tsx`)
3. Notice lists links to available locales that DO have published translations
4. User can navigate to the same content in another locale

Implementation: data functions return `availableLocales: Locale[]` — the locales that have a published translation for this entity. If empty, the content truly isn't available anywhere yet.

**Never auto-translate. Never silently substitute another locale's text.**

### RTL Support (Arabic)

1. **`dir="rtl"` on the locale wrapper `<div>`** — set in `app/(public)/[locale]/layout.tsx` using `isRtl(locale)` from `lib/i18n/config.ts`
2. **Tailwind logical properties** throughout all shared components:
   - Use `ms-*`/`me-*` (margin-start/end) instead of `ml-*`/`mr-*`
   - Use `ps-*`/`pe-*` (padding) instead of `pl-*`/`pr-*`
   - Use `start-*`/`end-*` (positioning) instead of `left-*`/`right-*`
   - **Never hardcode `left`/`right` in any shared component**
3. **Arabic form inputs**: `dir="auto"` on text fields; numeric inputs always `dir="ltr"`
4. **Per-script typography** via CSS `:lang()` selectors in `styles/globals.css`

### Per-locale SEO

`buildMetadata()` in `lib/seo/metadata.ts` generates for every page:
- `canonical` → `https://{NEXT_PUBLIC_SITE_URL}/{locale}/{path}`
- `alternates.languages` → all 3 locale variants + `x-default` pointing to `/bn/{path}`
- OG title, description, image (falls back to default OG image from site settings)
- Twitter card

Each `*_translations` row owns: `seo_title`, `meta_description`, `og_title`, `og_description`, `og_image_id`.

---

## 6. Security & Auth Rules

### Authentication Architecture

Custom admin authentication with **DB session strategy** (sessions in the `sessions` table — not JWTs). Session cookie: httpOnly + Secure + SameSite=Lax. Session duration: 8h with sliding renewal.

### TOTP 2FA

| Role | 2FA Requirement |
|---|---|
| `admin` | **Mandatory** — admin without enrolled TOTP is redirected to setup; cannot access admin at all |
| `editor` | Optional — self-service enrollment |

TOTP secret stored encrypted at rest: AES-256-GCM, key from `TOTP_ENCRYPTION_KEY` env var. The raw secret is never persisted. Recovery codes: 10 single-use codes, Argon2id hashed, shown to user once at enrollment.

### Password Rules

- **Algorithm**: Argon2id — `memoryCost: 65536` (64 MB), `timeCost: 3`, `parallelism: 4`
- **Policy**: ≥12 characters; small blocklist; no forced complexity rules (NIST SP 800-63B)
- Never use bcrypt or PBKDF2 for new passwords

### Login Security

1. **Generic error messages** — NEVER distinguish "email not found" from "wrong password". Always: `"Invalid email, password, or 2FA code."`
2. **Account lockout** — `failed_login_count` increments on each failure; `locked_until` set after threshold
3. **Rate limiting** — checked before Argon2 hash verification:

| Bucket | Window | Threshold |
|---|---|---|
| `login:ip:<ip>` | 15 min | 20 attempts → 429 |
| `login:user:<id>` | 15 min | 5 failures → lock 15 min |
| `login:user:<id>` | 24 h | 15 failures → lock until admin intervention |
| `submission:ip:<ip>` | 10 min | 5 submissions → 429 |

4. **Users deactivated, never hard-deleted** — `is_active = false`; audit log references preserved
5. **Session invalidation on**: role change, password reset, 2FA enable/disable; password change invalidates ALL sessions for that user

### Password Reset

Only the token **hash** is stored in `password_reset_tokens`; the raw token travels by email link only. Tokens are single-use (`used_at` set on first use). Expire after 60 minutes.

### Audit Log Contract

- **Every admin mutation writes to `audit_log`** in the same DB transaction
- If the audit INSERT fails → the entire mutation rolls back (fail-closed)
- `diff` field: never include `password_hash`, `totp_secret_encrypted`, `code_hash`, or any token value
- The table is **append-only** — no `UPDATE` or `DELETE` by the application, ever
- `actor_role` is snapshotted at action time (does not update if the user's role changes later)

### Admin Route Protection

All `app/(admin)/admin/*` routes (except `/admin/login`) are protected server-side by the `withAdmin` guard in `admin/layout.tsx` (Phase 15). The guard asserts: valid session + `is_active = true` + correct role. UI hiding is never sufficient alone.

### Content Security Policy

CSP headers are set in `proxy.ts` (Phase 23). Until Phase 23 ships, inline `<script>` tags use `dangerouslySetInnerHTML` for JSON-LD only — this is the single approved exception. All other inline scripts are forbidden.

### Media Upload Pipeline

1. Admin requests presigned R2 PUT URL from `/api/admin/media/sign`
2. Client PUTs directly to R2 (no server upload proxy)
3. Admin calls `/api/admin/media/commit` — server sniffs real MIME from magic bytes, strips EXIF, generates image variants, writes `media` row
4. Allowlist: `image/jpeg`, `image/png`, `image/webp`, `application/pdf`
5. Size caps: 10 MB images, 25 MB PDFs
6. Storage key: UUID-based (never exposes original filename in URL)

### Submission Protection

- Cloudflare Turnstile server-side token verification
- Honeypot hidden field (must be empty)
- Rate limit per IP (see table above)
- Zod validation: length bounds, no control characters
- No confirmation email to submitter (prevents outbound spam abuse)
- `ip` column nulled by retention cron after 90 days; submission rows never deleted

---

## 7. Admin System

### Roles

Only two roles in MVP: **admin** and **editor**. Users are deactivated (never hard-deleted).

### Capability Matrix

| Capability | Editor | Admin |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Posts / Pages / Campaigns / Resources / Leadership: create, edit, publish, unpublish, soft-delete, restore | ✅ | ✅ |
| Media: upload, update alt text / caption | ✅ | ✅ |
| Submissions: view, change status, add notes | ✅ | ✅ |
| Media: delete | ❌ | ✅ |
| Navigation: edit | ❌ | ✅ |
| Site settings: edit | ❌ | ✅ |
| Users: list, create, deactivate, change role | ❌ | ✅ |
| Audit log: view | ❌ | ✅ |
| Force-logout another user's sessions | ❌ | ✅ |
| Manual cache revalidation (`revalidateTag`) | ❌ | ✅ |

Server-side role check is mandatory for every admin-only action — UI visibility alone is insufficient.

### Content Publishing Rules

- Two states only: **draft** and **published** (no approval chain in MVP)
- Per-locale publish is independent — publishing BN never requires EN/AR
- Required before publish: `title`, `slug`, `body`, `meta_description`
- Slug edit on a published translation: requires confirmation → writes `slug_redirects` row automatically
- Soft-delete is reversible; hard-delete is not available in MVP for content (only media)

### Admin Editor UX

- 3-tab editor: **BN** (default) / **EN** / **AR** — each tab saves independently
- Autosave at 30s idle; no version history in MVP
- Arabic tab renders form inputs in RTL (`dir="rtl"`)
- Completeness overview on list pages: BN / EN / AR status dots per row
- No bulk operations in MVP

---

## 8. Design System

### Color Tokens (defined in `styles/globals.css` `@theme` block)

```
--color-brand-deep:   #0B3D2E   primary dark
--color-brand-black:  #071A14   hero / footer bg
--color-accent-gold:  #D4AF37   primary accent — NEVER on white/light backgrounds
--color-accent-green: #2ECC71   status / success only
--color-neutral-50:   #F3F4F6   light section bg
--color-neutral-200:  #E5E7EB   borders
--color-neutral-900:  #111827   headings on light
--color-bg-page:      #FFFFFF   page background
--color-bg-card:      #FFFFFF   card background
--color-border:       var(--color-neutral-200)
```

### Section Rhythm (must not be broken)

```
Hero      → dark  (brand-black)
Section 2 → light (white / neutral-50)
Section 3 → dark  (brand-deep)
Section 4 → light
Footer    → dark  (brand-black) — always last
```

Never two consecutive same-tone sections.

### Typography

| Locale | Font | Heading line-height | Body line-height |
|---|---|---|---|
| BN | Hind Siliguri | 1.4 | 1.75 |
| EN | Inter | 1.2 | 1.65 |
| AR | Noto Naskh Arabic | 1.5 | 1.80 |

All fonts self-hosted via `next/font`. Per-script `size-adjust` applied for x-height harmony.

### Contrast

- WCAG AA minimum everywhere
- WCAG AAA on hero headings
- `#D4AF37` gold is **never** placed on white or light backgrounds

### Client Component Allowlist

The following are the only places where `"use client"` is permitted:

- `LanguageSwitcher` — uses `usePathname()`
- `MobileMenu` — uses `usePathname()` and mobile state
- Admin rich-text editor (Phase 17)
- Admin media upload zone (Phase 18)
- Admin toasts / notifications (Phase 16)
- Public contact/advisory form (Phase 20)
- Error boundaries

All other components must be Server Components.

---

## 9. Route Map

### Public Routes (locale-prefixed, all implemented)

```
/[locale]                         Homepage
/[locale]/about
/[locale]/leadership              Index-only — no detail pages in MVP
/[locale]/news                    List
/[locale]/news/[slug]             Detail (PPR — Suspense-wrapper pattern)
/[locale]/blog                    List
/[locale]/blog/[slug]             Detail (PPR — Suspense-wrapper pattern)
/[locale]/campaigns               List
/[locale]/campaigns/[slug]        Detail (PPR — Suspense-wrapper pattern)
/[locale]/resources               List
/[locale]/contact
/[locale]/privacy
/[locale]/terms
/[locale]/[...path]               Slug redirect catch-all — resolves old slugs → current URL
```

### Admin Routes (English only, no locale prefix)

```
/admin/login
/admin                            Dashboard
/admin/posts                      Blog + News (filtered by type)
/admin/posts/new
/admin/posts/[id]
/admin/pages/[id]
/admin/campaigns/new
/admin/campaigns/[id]
/admin/resources/new
/admin/resources/[id]
/admin/leadership/new
/admin/leadership/[id]
/admin/navigation
/admin/settings
/admin/media
/admin/submissions/[id]
/admin/users/[id]                 Admin role only
/admin/audit                      Admin role only
/admin/account/password
/admin/account/2fa/setup
/admin/account/2fa/recovery
```

### Reserved Slugs (cannot be used as content slugs)

`admin`, `api`, `_next`, `static`, `public`, `assets`, `media`, `uploads`, `auth`, `login`, `logout`, `robots.txt`, `sitemap.xml`, `favicon.ico`, `manifest.json`, `health`, `og`, `rss`, `feed`, `bn`, `en`, `ar`, `new`, `edit`, `draft`, `preview`, `page`, `tag`, `category`, `archive`, `search`

---

## 10. Environment Variables

See `.env.example` for the complete list. Required at runtime:

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_SITE_URL` | Full base URL (e.g. `https://example.com`) |
| `AUTH_SECRET` | Session token signing secret |
| `TOTP_ENCRYPTION_KEY` | AES-256-GCM key for TOTP secret storage (32-byte hex) |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 credentials |
| `R2_BUCKET_PUBLIC` / `R2_BUCKET_PRIVATE` / `R2_PUBLIC_URL` | R2 bucket names + CDN URL |
| `RESEND_API_KEY` / `EMAIL_FROM` / `EMAIL_STAFF_INBOX` | Email sending |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile |
| `CRON_SECRET` | Bearer token protecting `/api/cron/retention` |

### Scripts

```bash
npm run dev           # Development server
npm run build         # Production build (must exit 0 without DATABASE_URL pointing to live DB)
npm run lint          # ESLint
npm run db:generate   # Generate migration from schema changes
npm run db:migrate    # Apply pending migrations
npm run db:push       # Dev only — push schema directly (bypasses migration files)
npm run db:studio     # Drizzle Studio (visual DB browser)
npm run db:seed       # Idempotent seed (dev / initial setup)
```

### Seed Script

```bash
SEED_ADMIN_EMAIL=admin@yourdomain.com \
SEED_ADMIN_PASSWORD=YourSecure12!Pass \
DATABASE_URL="postgres://..." \
npm run db:seed
```

Seeds: `site_settings` singleton, 3 locale translation rows, 5 core pages (home/about/contact/privacy/terms), 1 admin user, header + footer nav items (all with BN/EN/AR labels). Safe to re-run.

---

## 11. Build Progress

### Completed Phases

| Phase | Description | Status |
|---|---|---|
| 1–6 | Product definition, schema, Drizzle setup, i18n, Next.js 16 scaffold, routing/proxy | ✅ |
| 7–14 | Public layouts, homepage, pages, content lists/details, resources, submissions, legal pages | ✅ |
| 15–16 | Admin auth, shell, dashboard, loading/error/not-found states | ✅ |
| 17–20 | Admin CRUD, media library, settings/navigation, contact/advisory submissions | ✅ |
| 21–23 | SEO layer, sitemap/robots, cron/retention, CSP/security hardening, audit viewer | ✅ |
| 24–25 | Performance polish, launch checklist, health endpoint, admin toasts, editor autosave | ✅ |

### Build State (production-ready)

```
✓  next build → exit 0
✓  100/100 static pages generated
✓  TypeScript: 0 errors
✓  ESLint: 0 errors
◐  [slug] detail pages → Partial Prerender (static locale shell + PPR content stream)
ƒ  API routes → dynamic server-rendered on demand
```

### Launch Task Status

| Group | Status |
|---|---|---|
| Security tasks S1–S5 | ✅ Complete |
| Admin tasks A1–A7 | ✅ Complete |
| SEO/engineering tasks E1–E2 | ✅ Complete |
| Cleanup/documentation tasks C1–C2 | ✅ Complete |

---

## 12. Critical Next.js 16 Patterns

**Read this section before writing any route, layout, or data function.**  
Next.js 16 with `cacheComponents: true` has strict rendering constraints that differ from earlier versions.

### The `'use cache'` Directive

Replaces deprecated `unstable_cache`. Place as the **first statement** of the function body (not the file top).

```typescript
// lib/data/public/posts.ts
export async function getPostList(type: PostType, locale: Locale) {
  'use cache';
  cacheTag(`posts-${type}`, `posts-${type}-${locale}`);
  // cacheLife('hours'); // optional — omit for default TTL

  try {
    return await db.select(...)...;
  } catch {
    return []; // ← MANDATORY: build runs without a live DB; must not throw
  }
}
```

Rules:
- **ALL** public data functions use `'use cache'`
- **ALL** `'use cache'` functions catch DB errors and return `null` or `[]` — enables `next build` without a live DB
- **Admin data functions do NOT use `'use cache'`** — admin data must always be fresh
- `cacheTag()` naming convention: `'{entity}'`, `'{entity}-{locale}'`, `'{entity}-{locale}-{id}'`
- Invalidation is done in admin Server Actions: `revalidateTag('posts-blog')` after publish/unpublish

### The Suspense-Wrapper Pattern (mandatory for all `[param]` pages)

With `generateStaticParams` in the locale `layout.tsx`, Next.js 16 pre-renders the route template for each locale. This means `await params` in the page component is "uncached dynamic data outside Suspense" — a hard build error.

**Solution**: the page shell is a synchronous component that passes the `params` Promise to an `async` child wrapped in `<Suspense>`. All dynamic work (`await params`, data fetching) happens inside the boundary.

```typescript
// app/(public)/[locale]/news/[slug]/page.tsx

interface Props {
  params: Promise<{ locale: Locale; slug: string }>;
}

// ✅ Synchronous page shell — safe to render as static template
export default function NewsDetailPage({ params }: Props) {
  return (
    <Suspense fallback={null}>
      <NewsDetailContent params={params} />
    </Suspense>
  );
}

// ✅ Async content component — dynamic work inside Suspense boundary
async function NewsDetailContent({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;       // ← safe: inside Suspense
  const post = await getPostBySlug("news", slug, locale); // ← 'use cache': safe
  if (!post) notFound();
  return <>...JSX...</>;
}
```

Applied to: `news/[slug]`, `blog/[slug]`, `campaigns/[slug]`, `[...path]`

This pattern is also required for any future `[id]` admin pages.

### `generateStaticParams` Lives in the Locale Layout Only

```typescript
// app/(public)/[locale]/layout.tsx — THE ONLY generateStaticParams in (public)
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
  // Returns: [{ locale: 'bn' }, { locale: 'en' }, { locale: 'ar' }]
}
```

**Individual pages do NOT have `generateStaticParams`.** Individual `[slug]` pages use PPR — locale shell is static, slug content streams at request time.

### `export const dynamic` is Prohibited

```typescript
// ❌ NEVER add this — incompatible with cacheComponents: true
export const dynamic = "force-dynamic";
```

This causes a hard build error: `"Route segment config 'dynamic' is not compatible with nextConfig.cacheComponents"`. All routes are dynamic by default under `cacheComponents`; static behavior comes from `'use cache'` data functions.

### Root Layout Must Not Read Request Data

```typescript
// app/layout.tsx — correct
export default function RootLayout({ children }) {
  return (
    <html lang="bn" className={`${fontEn.variable} ${fontBn.variable} ${fontAr.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

**Never** call `headers()`, `cookies()`, or any request-time API in `app/layout.tsx`. These are "uncached dynamic data outside Suspense" and break **all** routes. Per-locale `lang` and `dir` are set on the `<div>` wrapper in `app/(public)/[locale]/layout.tsx`.

### Suspense Around `usePathname()` Client Components

Client components that call `usePathname()` must be wrapped in `<Suspense>` at their usage site in server components:

```typescript
// components/shell/header.tsx
<Suspense fallback={null}>
  <LanguageSwitcher currentLocale={locale} dict={dict} />
</Suspense>
<Suspense fallback={null}>
  <MobileMenu locale={locale} dict={dict} navItems={navItems} />
</Suspense>
```

Without this, the build throws: `Error: Uncached data was accessed outside of <Suspense>` with the stack pointing at `usePathname()`.

### `TypeScript` Return Types for Components That Only Throw

If an async server component always throws (via `notFound()` or `redirect()`), annotate it as `Promise<never>`:

```typescript
async function RedirectResolver({ params }: Props): Promise<never> {
  // always calls notFound() or redirect()
}
```

This prevents TypeScript error: `Type 'Promise<void>' is not assignable to type 'ReactNode'`.

### Cache Tag Naming Reference

```
site-settings
site-settings-{locale}
nav-{menu}                        e.g. nav-header, nav-footer
nav-{menu}-{locale}
posts-{type}                      e.g. posts-blog, posts-news
posts-{type}-{locale}
posts-{type}-{locale}-{id}
campaigns
campaigns-{locale}
campaigns-{locale}-{id}
resources
resources-{locale}
leadership-{locale}
pages-{key}                       e.g. pages-about, pages-home
pages-{key}-{locale}
```

Admin Server Actions call `revalidateTag()` with the relevant tags after any mutation that affects public data.

---

## 13. Rules for AI Agents

If you are an AI agent (Claude, Cursor, Copilot, or other) working on this codebase:

1. **Read this file in full first.** Do not assume Next.js version, routing conventions, or patterns from training data.
2. **Read `AGENTS.md` in the repo root.** It has framework-specific guidance that overrides defaults.
3. **Read `node_modules/next/dist/docs/`** before writing any route code — Next.js 16 differs from your training data.
4. **Never auto-translate content.** Manual authorship per locale is a hard requirement.
5. **Never expose secrets client-side.** All env vars without `NEXT_PUBLIC_` prefix are server-only.
6. **Never import `lib/data/admin/*` from public routes.** See §3 import boundaries.
7. **Never skip the `withAdmin(role)` guard on an admin Server Action.** No exceptions.
8. **Never hardcode page copy.** All editorial content comes from the database.
9. **Never add `export const dynamic = "force-dynamic"`.** See §12.
10. **Never call `headers()` or `cookies()` in `app/layout.tsx`.** See §12.
11. **All `[param]` pages under `[locale]` layout must use the Suspense-wrapper pattern.** See §12.
12. **All `'use cache'` functions must wrap DB queries in try/catch.** Build must succeed without a live DB.
13. **Never use `left`/`right` CSS properties in shared components.** Use logical properties (`start`, `end`, `ms`, `me`).
14. **Never write a client component outside the allowlist in §8.** Check the list before adding `"use client"`.
15. **Slug changes on published content must create a redirect row.** Never silently break a live URL.
16. **Audit log writes are transactional.** Do not move them outside the mutation's DB transaction.
17. **There is no `tailwind.config.ts`.** Tailwind v4 is configured entirely in `styles/globals.css` `@theme` block.
18. **The proxy file is `proxy.ts`**, not `middleware.ts`.
19. **26 database tables are already defined.** Do not add new tables without explicit design review.
20. **`lib/db/seed.ts` is dev-only.** Never import or call it from production code.

---

*End of PROJECT_SUMMARY.md — production-ready launch baseline.*
