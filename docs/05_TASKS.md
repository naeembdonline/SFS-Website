# 05 — Task Tracker

## Completed Tasks

### Infrastructure & Setup
- [x] **Phase 1** — Product definition (trilingual civic platform, MVP scope)
- [x] **Phase 2** — Database schema (all tables, enums, indexes, relations)
- [x] **Phase 3** — Drizzle ORM setup + migrations
- [x] **Phase 4** — i18n config (`lib/i18n/config.ts`, dictionaries, RTL support)
- [x] **Phase 5** — Next.js 16 project scaffold (Turbopack, `cacheComponents: true`)
- [x] **Phase 6** — Routing structure (locale prefix, route groups, proxy.ts middleware)

### Public Site
- [x] **Phase 7** — Public layouts (root layout with lang/dir, Container, Prose)
- [x] **Phase 8** — Homepage
- [x] **Phase 9** — About, Leadership pages
- [x] **Phase 10** — Blog + News list and detail pages (with `NotTranslated` fallback)
- [x] **Phase 11** — Campaigns list and detail pages
- [x] **Phase 12** — Resources list and detail pages
- [x] **Phase 13** — Contact form (`/api/submissions`, Turnstile, rate limiting)
- [x] **Phase 14** — Legal pages (privacy, terms), catch-all CMS page route

### Admin Panel
- [x] **Phase 15** — Admin content CRUD (posts, campaigns, resources, leadership, media, settings, navigation, submissions)
- [x] **Phase 16** — Admin shell polish (error.tsx, loading.tsx, not-found.tsx, dashboard stats, empty states, stub pages)

### SEO
- [x] **hreflang** — `buildMetadata()` generates `alternates.languages` for all 3 locales + `x-default`
- [x] **Missing-translation fallback** — two-step slug query + `NotTranslated` component with per-locale paths for blog, news, campaigns, resources

### Security (P0 Blockers — all complete)
- [x] **S1** — Security headers in `proxy.ts` (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy)
- [x] **S2** — TOTP/2FA (enrollment flow, QR code, recovery codes, login challenge, mandatory shell enforcement)
- [x] **S3** — Password reset flow (request → Resend email → token verify → Argon2id re-hash → session purge)
- [x] **S4** — `lib/env.ts` updated with all required env vars (AUTH_SECRET, R2_*, EMAIL_FROM, EMAIL_STAFF_INBOX)

### Admin Panel (continued)
- [x] **A1 — Pages CRUD**
  - `lib/validation/pages.ts` — Zod schemas (`updatePageSchema`, `publishPageSchema`, `parseUpdatePageFormData`)
  - `lib/data/admin/pages.ts` — `getAdminPageList()`, `getAdminPageById()` (left-join, per-locale status map)
  - `lib/actions/pages.ts` — `updatePageAction` (upsert translations + sectionsJson), `publishPageAction`, `unpublishPageAction`; cache invalidation via `revalidateTag(tag, "max")`
  - `components/admin/editor/page-editor.tsx` — sections JSON textarea for home/about; body field for all; hidden `sections_json` input for non-sections pages
  - `components/admin/pages/publish-controls.tsx` — publish/unpublish per locale; no delete (pages are permanent/pre-seeded)
  - `app/(admin)/admin/(shell)/pages/page.tsx` — full list with key badge, per-locale status chips, Edit link; no "+ New" button
  - `app/(admin)/admin/(shell)/pages/[id]/page.tsx` — edit page: breadcrumb, PageEditor + PagePublishControls in two-column layout

---

## Remaining Tasks — 100% Complete

### P1 — High Priority (blocks production launch)

- [x] **A4 — Users Management**
  - `lib/validation/users.ts` — Zod schemas (`inviteUserSchema`, `setUserActiveSchema`, `changeUserRoleSchema`)
  - `lib/data/admin/users.ts` — `getAdminUserList()`, `getAdminUserById()`
  - `lib/actions/users.ts` — `inviteUserAction` (creates user + setup token + Resend email), `setUserActiveAction` (deactivate/reactivate + session purge), `changeUserRoleAction`, `resendInviteAction`; all admin-only via `withAdmin(fn, { role: "admin" })`; all audit-logged
  - `components/admin/users/invite-form.tsx` — collapsible inline invite form (email, display name, role)
  - `components/admin/users/user-actions.tsx` — `ToggleActiveButton`, `ChangeRoleButton`, `ResendInviteButton` (self-action guard, role-gated)
  - `app/(admin)/admin/(shell)/users/page.tsx` — full list: role badge, status badge, 2FA badge, last login, action buttons; editors see read-only view

- [x] **E1 — Resources in Sitemap**
  - `lib/data/public/resources.ts` — add `getPublishedResourceSlugs()` function
  - `app/sitemap.ts` (or `app/sitemap.xml/route.ts`) — add resource detail URLs to sitemap output

### P2 — Medium Priority

- [x] **A2 — Submission Detail Route**
  - `lib/data/admin/submissions.ts` — added `getAdminSubmissionById()` and `mapRow()` helper; extended `AdminSubmissionItem` with `handledAt` / `handledByUserId`
  - `components/admin/submissions/submission-update-form.tsx` — client form: status select + admin notes textarea + save feedback; exports `STATUS_STYLES`
  - `app/(admin)/admin/(shell)/submissions/[id]/page.tsx` — full detail view: sender card, full message, metadata (IP with retention check, user agent, handledAt), manage sidebar panel
  - `components/admin/submissions/submission-row-form.tsx` — added optional `detailHref` prop; renders "View →" link in new column
  - `app/(admin)/admin/(shell)/submissions/page.tsx` — passes `detailHref` to each row

- [x] **A3 — 2FA Account Settings (in-shell)**
  - `lib/actions/totp.ts` — added `getRecoveryCodeStatusAction()` (remaining/used count, no raw codes) and `regenerateRecoveryCodesAction()` (requires current TOTP confirmation, replaces all codes, audit-logged)
  - `components/admin/auth/recovery-codes-panel.tsx` — shows remaining codes progress bar; low-code warning; confirm-with-TOTP regeneration form; displays new codes once after success
  - `app/(admin)/admin/(shell)/account/2fa/recovery/page.tsx` — shell-wrapped recovery management page with breadcrumb; redirects to setup if 2FA not yet enabled
  - Note: `/admin/account/2fa/setup` was already complete (standalone page, outside shell); password-change form deferred to A3-b

- [x] **S5 — Health Endpoint**
  - `app/api/health/route.ts` — returns `{ ok: true, ts: ... }` with 200; used by uptime monitors and load balancer checks

### P3 — Lower Priority (quality/completeness)

- [x] **A5 — Audit Log Viewer**
  - `app/(admin)/admin/(shell)/audit/page.tsx` — replace stub with paginated table of `audit_log` rows
  - `lib/data/admin/audit.ts` — paginated query with filters (action, actor, date range)

- [x] **A6 — Admin Toasts**
  - `components/admin/toast.tsx` — lightweight admin toast provider and action-state toast hook
  - `app/(admin)/admin/(shell)/layout.tsx` — wraps shell content in `ToastProvider`
  - Generic editor and user forms show success/error notifications after Server Actions

- [x] **E2 — Sitemap `lastModified`**
  - Replace `new Date()` placeholder with actual `updatedAt` from DB in `sitemap.ts`
  - Requires fetching latest `updatedAt` per entity type

- [x] **A7 — Editor Autosave**
  - 30-second autosave to `localStorage` (or draft DB row) in the content editor
  - Prevents data loss on accidental navigation

- [x] **C1 — Catch-all Data Function**
  - Move the DB query in `app/(public)/[locale]/[...path]/page.tsx` into `lib/data/public/pages.ts`
  - Consistent with import boundary pattern

- [x] **C2 — Update PROJECT_SUMMARY.md**
  - Reflect completion of Phases 1–25 and all tasks S1–S5, A1–A7, E1–E2, C1–C2
  - Current Status shows the project is Production Ready

---

## Notes for the Next Developer / Agent

1. **Never use `export const dynamic`** — not available in Next.js 16. All routes are dynamic by default with `cacheComponents: true`.
2. **All data mutations must write `writeAuditLog()` inside the same `db.transaction()`** — fail-closed.
3. **`lib/data/public/*` must never appear in admin routes and vice versa** — import boundary is strictly enforced.
4. **TOTP enforcement is in the shell layout**, not middleware — middleware has no DB access.
5. **Security headers are in `proxy.ts`**, not `next.config.ts` — webpack HMR uses `eval()` in dev.
6. **New required env vars must be added to `lib/env.ts`** before use.
7. **Slug uniqueness is enforced via `slug_reservations` table** — always insert/update a reservation row when publishing content with a slug.
8. **RTL support**: use Tailwind logical properties (`ps-`, `pe-`, `ms-`, `me-`, `start-`, `end-`) not physical ones (`pl-`, `pr-`, `ml-`, `mr-`, `left-`, `right-`).
