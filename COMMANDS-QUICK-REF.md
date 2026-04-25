# COMMANDS-QUICK-REF.md — Sovereignty Website

Quick command reference for AI-assisted development on this project.

This file exists to keep execution simple, fast, and focused.

The project goal is not to use the maximum number of commands.
The goal is to use the right command at the right time.

---

## Core Rule

Use only the commands that are relevant to the current task.

Do not overuse planning, reviews, or optimization commands when the task is simple.
Do not skip planning, verification, or security review when the task is high-risk.

Clarity > ceremony  
Speed > complexity  
Quality > noise  

---

## 1. Core Workflow Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/plan` | Analyze the task, restate requirements, identify risks, and create a step-by-step implementation plan before coding | Use for medium/large features, redesigns, backend changes, admin workflows, security-sensitive work |
| `/implement` | Execute the planned implementation cleanly and directly | Use after `/plan` or for straightforward requested changes |
| `/build-fix` | Diagnose and fix build errors, type errors, runtime blockers, and env-related failures | Use when build/dev/runtime is broken |
| `/verify` | Run the standard verification flow for the project | Use before handoff, before deploy, or after meaningful code changes |
| `/code-review` | Review changed code for maintainability, clarity, UX impact, regressions, and technical quality | Use after medium/large code changes |
| `/quality-gate` | Check whether the result meets project standards for clarity, performance, security, and maintainability | Use before final approval or release |

---

## 2. UI / UX Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/ui-audit` | Audit the current UI for hierarchy, readability, contrast, layout rhythm, and visual clarity | Use when a page feels weak, cluttered, or inconsistent |
| `/ui-refine` | Improve design polish without redesigning the whole page | Use for premium cleanup, simplification, alignment, spacing, and consistency |
| `/hero-fix` | Improve the hero section’s clarity, impact, readability, and visual meaning | Use when the homepage hero feels confusing, weak, or too abstract |
| `/globe-fix` | Refine the globe/map visual so Earth and Bangladesh are clearer and more meaningful | Use when the hero visual is unclear, too abstract, too decorative, or too heavy |
| `/card-refine` | Improve card hierarchy, spacing, readability, and visual quality | Use for homepage cards, about cards, content cards, committee cards, etc. |
| `/cta-fix` | Improve CTA contrast, text clarity, button visibility, and conversion focus | Use when CTA sections are weak, faded, low-contrast, or unclear |
| `/footer-clean` | Simplify and strengthen the footer structure, readability, and visual ending | Use when the footer feels cluttered, generic, weak, or over-designed |
| `/contrast-fix` | Fix low-contrast text and readability problems, especially in dark sections | Use when text is difficult to read |
| `/layout-rhythm` | Improve section flow, spacing rhythm, and reduce repetitive page structure | Use when scrolling feels monotonous or sections merge together |
| `/mobile-check` | Review and improve mobile responsiveness and small-screen readability | Use after any major visual or layout change |

---

## 3. Content / Editorial Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/content-check` | Review content clarity, section purpose, messaging strength, and readability | Use when copy feels weak, generic, or structurally messy |
| `/content-model` | Design or refine the project’s public content structure | Use for blog/news/campaign/resource/committee models |
| `/editor-workflow` | Define or improve editorial publishing workflow for admins/editors | Use when designing the custom content system |
| `/slug-check` | Review slug rules, routing safety, and stable URL behavior | Use when planning content editing or migration |
| `/i18n-check` | Review multilingual behavior, fallback logic, and localized content handling | Use when adding BN/EN/AR or adjusting translation logic |
| `/copy-refine` | Improve microcopy, hero messaging, CTA text, section intros, and labels | Use when text works functionally but lacks quality or impact |

---

## 4. Backend / Admin Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/admin-architecture` | Plan the custom admin/editor area structure | Use when designing dashboards, editor tools, content CRUD, submission review, or role-aware workflows |
| `/db-design` | Design or refine the database schema for public content and private/internal data | Use for PostgreSQL schema planning and table relations |
| `/crud-build` | Build or improve content CRUD flows | Use for blog/news/campaign/resource/committee admin functionality |
| `/role-check` | Review and implement role-based access logic | Use when building editor/admin/reviewer/viewer access |
| `/submission-flow` | Build or improve contact/advisory submission handling and review logic | Use for internal workflow features |
| `/api-review` | Review server routes, handlers, validation, and response safety | Use after backend work or API changes |
| `/upload-flow` | Build or improve media/file upload flows | Use when implementing image/document uploads |

---

## 5. Performance Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/perf-audit` | Audit performance bottlenecks affecting speed and Core Web Vitals | Use when the site feels slow or heavy |
| `/perf-fix` | Apply performance optimizations across frontend and backend | Use after `/perf-audit` or when speed is clearly weak |
| `/image-optimize` | Review image usage, format, loading strategy, and responsive handling | Use when hero/media/content images are heavy |
| `/font-optimize` | Improve font loading and reduce typography-related performance cost | Use when custom fonts affect performance or CLS |
| `/hydrate-check` | Audit unnecessary client-side JS and hydration | Use when pages feel heavier than they should |
| `/cache-check` | Review caching, revalidation, and server/data fetching efficiency | Use for content pages, admin pages, and public pages |

---

## 6. SEO / AEO / GEO Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/seo-audit` | Audit and improve SEO across titles, descriptions, canonicals, OG tags, heading hierarchy, and internal linking | Use before launch or after major page/content changes |
| `/metadata-fix` | Fix metadata issues on specific pages or across the site | Use when titles/descriptions/canonicals are missing or inconsistent |
| `/schema-check` | Audit and improve structured data / JSON-LD | Use when adding or refining Organization, Article, Breadcrumb, About, Contact, etc. |
| `/geo-check` | Review Bangladesh-focused location/relevance signals and organization identity consistency | Use when improving regional relevance and trust signals |
| `/aeo-check` | Improve answer-engine readability and structured clarity | Use when optimizing for AI/answer engines |
| `/sitemap-check` | Review sitemap, robots, indexing behavior, and crawl readiness | Use before production launch |
| `/internal-linking` | Improve internal linking structure for discoverability | Use when content volume grows |

---

## 7. Security Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/security-check` | Review the current code for security risks | Use before release, after auth/admin changes, or after backend work |
| `/secret-scan` | Check for exposed secrets, unsafe env usage, or client-side leakage | Use whenever env variables or third-party keys are involved |
| `/auth-check` | Review auth/session safety and route protection | Use when working on login, roles, admin, or protected pages |
| `/validation-check` | Review input validation and boundary safety | Use for forms, admin inputs, uploads, and public submissions |
| `/headers-check` | Review security headers and hardening posture | Use before deployment |
| `/abuse-check` | Review spam/abuse protection readiness for forms and public endpoints | Use for contact/advisory/public forms |

---

## 8. Testing / Verification Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/test-plan` | Define what needs testing for a given feature or fix | Use before building medium/large features |
| `/smoke-test` | Run a basic verification across key routes and flows | Use after meaningful UI or routing changes |
| `/form-test` | Verify form behavior, validation, success/error states, and submission flow | Use for contact or admin forms |
| `/auth-test` | Verify login, logout, protected routes, and role checks | Use after auth/admin changes |
| `/seo-test` | Verify that metadata and structured data render correctly | Use before launch |
| `/prelaunch-check` | Final production readiness check across functionality, UX, performance, SEO, and security | Use immediately before deployment |

---

## 9. Documentation Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/docs-update` | Update project-specific docs after meaningful changes | Use when workflows, architecture, or setup changed |
| `/env-docs` | Document environment variables and their purpose | Use when env requirements change |
| `/admin-docs` | Document how the custom admin/editor system should be used | Use when editorial/admin workflows are added |
| `/deploy-docs` | Update deployment instructions and launch checklist | Use before or after deployment work |
| `/content-docs` | Document content types, editorial flow, and publishing guidance | Use when content workflows are defined |

---

## 10. Architecture / Rebuild Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/rebuild-plan` | Create a clean rebuild roadmap for the site or platform | Use when starting over or planning a major rewrite |
| `/stack-review` | Review and recommend the best technical stack for the product | Use before deep architectural decisions |
| `/migration-plan` | Plan migration from third-party tools to custom architecture | Use when replacing existing CMS/backend/auth systems |
| `/admin-blueprint` | Plan the custom admin/editor product from a UX and data perspective | Use before building internal tools |
| `/system-boundaries` | Define boundaries between public content, internal data, media, roles, and workflows | Use during architecture planning |

---

## 11. Session / Work Management Commands

| Command | Purpose | When to Use |
|--------|---------|-------------|
| `/checkpoint` | Save a meaningful milestone in the current task | Use before big edits or when changing direction |
| `/resume` | Resume the current task from the latest checkpoint/context | Use after interruption |
| `/next-steps` | Summarize the best next actions | Use when deciding what to do next |
| `/handoff` | Create a clean handoff summary for future continuation | Use when pausing work |
| `/focus-reset` | Strip away side quests and return to the main product goal | Use when work becomes noisy or scattered |

---

## 12. Quick Decision Guide

Use this guide when unsure what to run.

### Starting something new
- medium/large task → `/plan`
- major rebuild → `/rebuild-plan`
- architecture decision → `/stack-review` or `/system-boundaries`

### UI feels weak
- page feels messy → `/ui-audit`
- page needs polish → `/ui-refine`
- hero unclear → `/hero-fix`
- cards weak → `/card-refine`
- CTA weak → `/cta-fix`
- footer weak → `/footer-clean`

### Site feels slow
- investigate → `/perf-audit`
- optimize → `/perf-fix`
- images heavy → `/image-optimize`
- JS heavy → `/hydrate-check`

### SEO / discoverability
- full audit → `/seo-audit`
- metadata issue → `/metadata-fix`
- schema issue → `/schema-check`
- indexing issue → `/sitemap-check`

### Security
- overall review → `/security-check`
- secret concern → `/secret-scan`
- auth issue → `/auth-check`
- form safety → `/validation-check` or `/abuse-check`

### Before launch
- functionality + UX + speed + security + SEO → `/prelaunch-check`
- standard verification → `/verify`

---

## 13. Recommended Minimal Flow

For most real work on this project, use this sequence:

### Small UI fix
1. `/ui-audit`
2. `/ui-refine`
3. `/verify`

### Hero or homepage redesign
1. `/plan`
2. `/hero-fix`
3. `/layout-rhythm`
4. `/verify`

### New admin/content feature
1. `/plan`
2. `/admin-architecture`
3. `/db-design`
4. `/crud-build`
5. `/role-check`
6. `/verify`
7. `/code-review`

### Pre-launch pass
1. `/seo-audit`
2. `/perf-audit`
3. `/security-check`
4. `/prelaunch-check`

---

## 14. Commands to Use Carefully

These commands are high-impact and should not be used casually:

- `/rebuild-plan`
- `/migration-plan`
- `/admin-architecture`
- `/db-design`
- `/role-check`
- `/security-check`
- `/perf-fix`

Use them when the problem is real and important, not just because they sound powerful.

---

## 15. Final Rule

The purpose of these commands is to make the project better, not more complicated.

A good command helps:
- fix real problems
- improve clarity
- improve speed
- improve safety
- improve maintainability

A bad workflow adds:
- noise
- ceremony
- over-engineering
- confusion

Use this file as a practical execution guide, not as a rigid ritual system.