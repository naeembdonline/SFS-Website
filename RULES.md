# RULES.md — Sovereignty Website

This file defines the core development and product rules for this project.

These rules must be followed by both developers and AI assistants.

---

## Core Philosophy

Clarity > decoration  
Speed > complexity  
Trust > visual effects  
Maintainability > cleverness  

The goal is to build a premium, minimal, fast, and secure civic website.

---

## Must Always

- Keep UI clean, readable, and purposeful
- Ensure strong visual hierarchy and clear structure
- Maintain high readability (especially Bengali text)
- Validate all inputs (forms, APIs, admin actions)
- Keep secrets server-side only
- Use environment variables properly
- Reuse existing components and patterns
- Prefer simple and maintainable solutions
- Ensure responsive design (mobile + desktop)
- Verify build, lint, and type-check before finalizing changes
- Keep content structure consistent (blog, news, campaigns, etc.)

---

## Must Never

- Expose secrets (API keys, tokens, service role keys)
- Add unnecessary complexity or over-engineering
- Use heavy libraries without strong justification
- Break existing functionality or routes
- Ship code without testing critical flows
- Create duplicate components or logic without reason
- Use low-contrast text or unreadable UI
- Overuse gradients, blur, or decorative effects
- Mix public content workflows with internal admin workflows
- Build confusing or cluttered admin interfaces

---

## UI / UX Rules

- Design must feel premium, minimal, and modern
- Avoid visual noise (too many cards, borders, shadows)
- Each section must have a clear purpose
- Avoid repeating identical layouts across sections
- Use spacing and layout to create hierarchy
- CTA must always be visible and clear
- Hero must communicate meaning instantly
- Footer must be clean and structured

---

## Typography Rules

- Bengali text must be easy to read
- Avoid tight line-height for headings
- Avoid very small text (especially footer)
- Maintain consistent heading hierarchy (h1, h2, h3)
- Ensure strong contrast between text and background

---

## Component Rules

- Prefer reusable components
- Keep components small and focused
- Avoid large, complex components when possible
- Maintain consistent styling across components
- Avoid duplicate UI patterns

---

## Content Rules

Public content includes:
- blog
- news
- campaigns
- resources / library
- committee
- homepage content

Internal data includes:
- contact/advisory submissions
- users and roles
- internal notes
- admin workflows

Rules:
- Keep public content and internal data logically separated
- Do not build a duplicate CMS inside the app
- Maintain stable URLs (slug safety)
- Ensure content is structured and SEO-friendly

---

## Performance Rules

- Site must load fast
- Avoid heavy animations and unnecessary effects
- Optimize images and fonts
- Minimize client-side JavaScript
- Use server-side rendering where appropriate
- Avoid unnecessary re-renders and hydration

---

## Security Rules

- Never expose secrets in client-side code
- Use server-only environment variables for sensitive data
- Validate all inputs
- Protect admin and restricted routes
- Use role-based access control
- Prevent form abuse (spam, invalid submissions)
- Avoid leaking internal data in responses

---

## SEO / AEO / GEO Rules

- Every page must have proper metadata (title, description)
- Use canonical URLs correctly
- Maintain clean and readable URLs
- Use structured data (JSON-LD) where appropriate
- Maintain internal linking between pages
- Ensure Bangladesh relevance is clear in content
- Keep heading hierarchy consistent for search engines

---

## Development Workflow

- Understand the problem before writing code
- Use `/plan` for medium/large tasks
- Keep changes small and focused
- Test critical flows (navigation, forms, auth)
- Run verification before finishing:
  - build
  - lint
  - type-check
- Review impact before merging changes

---

## Code Quality

- Keep code readable and simple
- Use clear naming conventions
- Avoid unnecessary abstractions
- Prefer explicit logic over overly clever code
- Document only where necessary

---

## Commit Style

- Use clear and meaningful commit messages
- Follow conventional commits:
  - feat:
  - fix:
  - refactor:
  - docs:
- Keep commits small and focused
- Explain user impact when relevant

---

## Final Rule

If a change makes the site:

- harder to understand ❌  
- slower ❌  
- less secure ❌  
- more complex ❌  

Then it should not be implemented.

Every change must improve:

- clarity  
- usability  
- performance  
- maintainability  