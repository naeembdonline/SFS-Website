# the-shortform-guide.md — Sovereignty Website

Quick guide for working on this project.

This is not a full documentation file.  
This is a fast reference for developers and AI usage.

---

## Goal

Build a:

- clean UI  
- fast website  
- secure system  
- scalable architecture  

Avoid over-engineering.

---

## 1. Project Stack

- Next.js (App Router)
- Tailwind CSS
- PostgreSQL
- Auth.js
- Cloudflare (CDN + security)

---

## 2. Core Workflow

### When starting a task

1. Understand the problem  
2. Use `/plan` for medium/large tasks  
3. Implement clean solution  
4. Verify before finishing  

---

### Standard flow

```
/plan → implement → /verify → /code-review
```

---

## 3. UI Work

If UI looks bad:

- use `/ui-audit`
- then `/ui-refine`

### Common fixes

- unclear hero → `/hero-fix`  
- weak CTA → `/cta-fix`  
- bad cards → `/card-refine`  
- messy layout → `/layout-rhythm`  
- unreadable text → `/contrast-fix`  

---

## 4. Performance

If site feels slow:

- run `/perf-audit`
- apply `/perf-fix`

### Always:

- optimize images  
- reduce JS  
- avoid heavy animation  

---

## 5. Security

Always:

- validate inputs  
- protect admin routes  
- keep secrets server-side  
- avoid exposing internal APIs  

Before launch:

```
/security-check
```

---

## 6. SEO / Discoverability

Before deployment:

- run `/seo-audit`
- check metadata
- check structured data

---

## 7. Content System

Public content:
- blog
- news
- campaigns
- library
- committee

Internal:
- submissions
- users
- roles

Rule:

Do not mix public content with internal data.

---

## 8. Before Deployment

Run:

```
/verify
/prelaunch-check
```

Check:

- build passes  
- env variables set  
- routes working  
- forms working  
- content visible  

---

## 9. Common Problems → Quick Fix

| Problem | Fix |
|--------|-----|
| UI looks weak | `/ui-refine` |
| Hero unclear | `/hero-fix` |
| Site slow | `/perf-fix` |
| SEO missing | `/seo-audit` |
| Build error | `/build-fix` |
| Security concern | `/security-check` |

---

## 10. Golden Rules

- keep it simple  
- do not over-engineer  
- reuse components  
- prioritize readability  
- prioritize performance  
- prioritize security  

---

## 11. Mental Model

Think like this:

- user sees UI → must be clear  
- system handles data → must be safe  
- site loads → must be fast  

---

## Final Rule

If something:

- feels complex ❌  
- looks messy ❌  
- slows down site ❌  
- reduces security ❌  

Remove or simplify it.