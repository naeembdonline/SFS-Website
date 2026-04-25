# 03 — Database Schema

Database: **PostgreSQL** (Neon serverless). ORM: **Drizzle ORM** (schema-first).
All PKs are `bigserial` (auto-increment `bigint`). All timestamps use `timestamptz`.

---

## Enums

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

---

## Auth Tables

### `users`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `email` | citext UNIQUE | Case-insensitive |
| `password_hash` | text | Argon2id |
| `role` | user_role | `admin` \| `editor` |
| `display_name` | text | Optional |
| `is_active` | boolean | Default true; set false to deactivate |
| `totp_secret_encrypted` | bytea | AES-256-GCM; null until TOTP enrolled |
| `totp_enabled` | boolean | Default false; must be true to access admin shell |
| `last_login_at` | timestamptz | Updated on successful login |
| `failed_login_count` | int | Reset on success; triggers lockout at threshold 5 |
| `locked_until` | timestamptz | Null or future date = account locked |

### `sessions`
| Column | Type | Notes |
|---|---|---|
| `id` | text PK | 32-byte random hex token (stored raw) |
| `user_id` | bigint FK → users | Cascade delete |
| `expires_at` | timestamptz | 8-hour sliding window |
| `created_ip` | inet | |
| `user_agent` | text | |

Cookie: `__Host-admin-sess` (httpOnly, Secure, SameSite=Lax, Path=/)

### `password_reset_tokens`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `user_id` | bigint FK → users | |
| `token_hash` | text UNIQUE | SHA-256 of raw token; raw token only in email link |
| `expires_at` | timestamptz | 1-hour window |
| `used_at` | timestamptz | Null = unused; set on redemption |

### `totp_recovery_codes`
| Column | Type | Notes |
|---|---|---|
| `id` | bigserial PK | |
| `user_id` | bigint FK → users | |
| `code_hash` | text | SHA-256 of raw code (format: XXXXX-XXXXX) |
| `used_at` | timestamptz | Null = unused |

8 codes generated per enrollment; each single-use.

---

## Content Tables (Entity + Translation pattern)

Every content type follows this pattern:
- **Entity table** — locale-agnostic metadata (status flags, media refs, timestamps, soft-delete)
- **Translation table** — one row per `(entity_id, locale)` — title, slug, body, SEO fields, publish status

### Content Entities

| Entity table | Translation table | Key columns |
|---|---|---|
| `posts` | `post_translations` | `type` (blog/news), `cover_media_id`, `author_user_id`, `first_published_at` |
| `pages` | `page_translations` | `key` (stable identifier: home/about/contact/privacy/terms), `sections` JSONB |
| `campaigns` | `campaign_translations` | `status_lifecycle` (active/past), `start_date`, `end_date`, `goals` |
| `resources` | `resource_translations` | `kind` (pdf/link/doc), `file_media_id`, `external_url` |
| `leadership` | `leadership_translations` | `display_order`, `is_visible`, `photo_media_id` |

### Translation Row (common fields)

All `*_translations` tables include:

| Column | Notes |
|---|---|
| `locale` | locale_t enum |
| `title` | Required |
| `slug` | Required (except pages which has nullable slug) |
| `status` | `draft` \| `published` |
| `published_at` | Null until first publish |
| `seo_title`, `meta_description` | SEO overrides |
| `og_title`, `og_description`, `og_image_id` | Open Graph overrides |

**Uniqueness**: `(entity_id, locale)` is unique — one translation per locale per entity.

---

## Media Table

### `media`
| Column | Notes |
|---|---|
| `storage_key` | R2 object key (UUID-based), unique |
| `bucket` | `public` or `private` |
| `mime` | Server-sniffed — never trust client value |
| `bytes`, `width`, `height` | Intrinsic dimensions |
| `checksum_sha256` | Integrity check |
| `variants` | JSONB array of `{key, width, format, bytes}` for processed sizes |
| `uploaded_by_user_id` | FK → users (restrict on delete) |

### `media_translations`
Per-locale `alt_text` and `caption`.

---

## Infrastructure Tables

### `submissions`
Public contact/advisory form submissions. PII fields (`ip`, `user_agent`) nulled after 90 days by the retention cron job.

### `rate_limits`
Sliding-window rate limiter. Bucket key pattern: `login:ip:{ip}`, `pwd-reset:ip:{ip}`, `submission:ip:{ip}`.
One row per `(bucket, window_start)` minute slot; count incremented via upsert.

### `slug_reservations`
Global slug namespace guard. Unique on `(entity_type, locale, slug)`. Prevents two different entities from having the same slug in the same locale.

### `slug_redirects`
Written when a published entity's slug changes. Used by the `[...path]` catch-all route to issue 301s for old slugs.

### `audit_log`
Immutable append-only log of all admin actions. See `docs/04_SECURITY.md` for policy.

### Settings tables
`site_settings` and `navigation_items` with per-locale translations — managed via admin settings/navigation pages.

---

## Key Relationships

```
users ──< sessions
users ──< password_reset_tokens
users ──< totp_recovery_codes
users ──< media (uploaded_by)
users ──< posts (author)
users ──< audit_log (actor)

posts ──< post_translations
pages ──< page_translations
campaigns ──< campaign_translations
resources ──< resource_translations
leadership ──< leadership_translations
media ──< media_translations

post_translations >── media (og_image)
campaign_translations >── media (og_image)
resource_translations >── media (og_image)
page_translations >── media (og_image)
posts >── media (cover)
campaigns >── media (cover)
leadership >── media (photo)
resources >── media (file)
```

---

## Soft Delete

All entity tables (`posts`, `pages`, `campaigns`, `resources`, `leadership`) have a `deleted_at` timestamptz column. Deletion sets this column; queries filter with `isNull(schema.x.deletedAt)`. Hard deletes are not used.
