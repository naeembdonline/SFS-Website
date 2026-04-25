# 01 — Project Overview

## What This Is

**Students for Sovereignty (স্টুডেন্টস ফর সভরেন্টি)** is a trilingual civic/advocacy website for the namesake Bangladesh-based student organization. It serves as the organization's primary public face and authoritative source for its positions, campaigns, news, and contact information.

The codebase is a Next.js 16 monorepo. There is no separate CMS — the same repository contains both the public-facing website and the private admin panel.

---

## Organization Profile

### Identity
- **Name:** Students for Sovereignty (স্টুডেন্টস ফর সভরেন্টি)
- **Inception:** August 28, 2024, at Dhaka University TSC. Founded during a protest against the use of the term 'Indigenous' by the interim government.

### Vision & Mission
- **Vision:** To build a conscious student society for a sovereign, secure, and self-reliant state free from foreign hegemony.
- **Mission:** Active participation in national interests, raising awareness on sovereignty and security issues, and standing against injustice through legal means.

### Leadership
- **Central Convener:** Muhammad Ziaul Haq (Former student, University of Dhaka)
- **DU Convener:** Muhammad Mohiuddin Rahat (Masters student, Criminology, University of Dhaka)

### Structure
The organization maintains a Central Committee and a DU (Dhaka University) Committee, with ongoing formation of committees for JU (Jahangirnagar University), JnU (Jagannath University), RU (Rajshahi University), CU (Chittagong University), and the 7-Colleges.

---

## সাংগঠনিক পরিচিতি (Bangla)

### পরিচয়
- **নাম:** স্টুডেন্টস ফর সভরেন্টি (Students for Sovereignty)
- **প্রতিষ্ঠা:** ২৮ আগস্ট ২০২৪, ঢাকা বিশ্ববিদ্যালয় টিএসসি। অন্তর্বর্তীকালীন সরকারের 'আদিবাসী' শব্দ ব্যবহারের প্রতিবাদে আন্দোলনের মাধ্যমে এর যাত্রা শুরু।

### লক্ষ্য ও উদ্দেশ্য
- **ভিশন:** বিদেশি আধিপত্যমুক্ত একটি সার্বভৌম, নিরাপদ এবং স্বনির্ভর রাষ্ট্রের জন্য একটি সচেতন ছাত্র সমাজ গঠন করা।
- **মিশন:** জাতীয় স্বার্থে সক্রিয় অংশগ্রহণ, সার্বভৌমত্ব ও নিরাপত্তা বিষয়ে সচেতনতা বৃদ্ধি এবং আইনগতভাবে অন্যায়ের বিরুদ্ধে সোচ্চার হওয়া।

### নেতৃত্ব
- **কেন্দ্রীয় আহ্বায়ক:** মুহাম্মদ জিয়াউল হক (সাবেক শিক্ষার্থী, ঢাকা বিশ্ববিদ্যালয়)
- **ঢাবি আহ্বায়ক:** মুহাম্মদ মহিউদ্দিন রাহাত (মাস্টার্স শিক্ষার্থী, অপরাধবিজ্ঞান বিভাগ, ঢাকা বিশ্ববিদ্যালয়)

### কাঠামো
সংগঠনটির একটি কেন্দ্রীয় কমিটি এবং ঢাবি কমিটি রয়েছে। এছাড়া জাবি, জবি, রাবি, চবি এবং ৭-কলেজের কমিটি গঠনের কাজ প্রক্রিয়াধীন।

---

## Target Audience

| Audience | Locale | Notes |
|---|---|---|
| Bangladeshi citizens (primary) | Bangla (`bn`) | Mobile-heavy; `bn` is the default locale |
| Bangladeshi diaspora + international press | English (`en`) | Mix of mobile and desktop |
| Arabic-speaking regional audiences | Arabic (`ar`) | RTL layout required |
| Journalists, researchers, policymakers | Any | SEO/AEO/GEO discoverability is critical |

---

## Website Goals

1. Communicate the organization's identity and mission clearly and credibly.
2. Publish news, blog posts, campaigns, and resources in three languages.
3. Provide a trusted public record that holds up to scrutiny and citation.
4. Enable direct contact and advisory submissions from the public.
5. Be discoverable via search and answer engines (SEO / AEO / GEO).
6. Be fast and readable on modest mobile devices and low-bandwidth connections.
7. Resist abuse, spam, and casual attack given the organization's political sensitivity.

---

## MVP Public Pages

| Route pattern | Purpose |
|---|---|
| `/{locale}` | Homepage — hero, mission, featured content |
| `/{locale}/about` | Mission and principles |
| `/{locale}/leadership` | Committee/leadership profiles |
| `/{locale}/campaigns` + `/[slug]` | Campaign list + detail |
| `/{locale}/news` + `/[slug]` | News list + detail |
| `/{locale}/blog` + `/[slug]` | Blog list + detail |
| `/{locale}/resources` + `/[slug]` | Downloadable docs and links |
| `/{locale}/contact` | Contact form |
| `/{locale}/privacy` + `/terms` | Legal pages |

---

## Admin Panel Goals (MVP)

- Secure login for staff only (no public signup)
- Roles: `admin` and `editor`
- CRUD for all content types: posts (blog + news), pages, campaigns, resources, leadership, navigation, site settings
- Media upload to Cloudflare R2
- Contact/advisory submission review
- Per-locale editing (BN / EN / AR)
- Draft / publish states
- Immutable audit log of all admin actions
- Mandatory TOTP 2FA for all accounts
- Password reset via email

---

## Key Design Decisions

- **Trilingual from day one** — BN, EN, AR are all first-class; no machine translation ever.
- **Bangla default** — `/bn` is the default locale; root `/` redirects there (respecting `locale_pref` cookie).
- **Locale-prefixed URLs always** — `/bn/...`, `/en/...`, `/ar/...`; no unprefixed content routes.
- **No user accounts on the public side** — readers never sign in.
- **Content-first** — site value is editorial content, not interactive features or community UGC.
- **Politically sensitive** — elevated security investment is warranted at MVP (TOTP mandatory, audit log, rate limiting, lockout, CSP, HSTS).
