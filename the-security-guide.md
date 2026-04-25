# the-security-guide.md — Sovereignty Website

This guide defines practical security rules for this project.

Security is not optional.  
Security is part of the product.

---

## Core Principle

Assume:

- malicious input will reach the system  
- attackers will try to exploit weak points  
- mistakes will happen  

Design the system so that failures are contained.

---

## 1. Secrets & Environment

### Rules

- Never expose secrets in client-side code
- Never commit `.env` files
- Always use environment variables
- Keep sensitive keys server-side only

### Sensitive Data Examples

- API keys  
- service role keys  
- database credentials  
- auth secrets  
- private tokens  

---

## 2. Authentication & Access Control

### Rules

- All admin routes must be protected
- Use role-based access control (RBAC)
- Never trust client-side role checks
- Always validate user role on the server

### Roles Example

- admin  
- editor  
- viewer  

---

## 3. Input Validation

### Rules

- Validate ALL inputs (forms, APIs, admin actions)
- Never trust user input
- Sanitize text before storing or processing
- Reject unexpected input formats

### Applies To

- contact forms  
- admin inputs  
- API requests  
- file uploads  

---

## 4. Public vs Private Data

### Public Content

- blog  
- news  
- campaigns  
- resources  
- committee  

### Private/Internal Data

- submissions  
- users  
- roles  
- internal notes  
- logs  

### Rule

Do NOT mix public publishing logic with internal admin logic.

---

## 5. File Upload Security

### Rules

- Restrict allowed file types
- Limit file size
- Scan or sanitize uploads when possible
- Do not trust file metadata
- Store files in controlled storage (R2 / S3)

---

## 6. API & Backend Security

### Rules

- Validate request body and parameters
- Use server-side logic for sensitive operations
- Do not expose internal APIs publicly
- Return only necessary data
- Avoid leaking internal structure

---

## 7. Form Protection

### Risks

- spam submissions  
- abuse  
- injection  

### Solutions

- rate limiting  
- server-side validation  
- basic anti-spam logic  
- optional CAPTCHA if needed  

---

## 8. Network & External Requests

### Rules

- Avoid unnecessary external API calls
- Do not trust external content blindly
- Sanitize external data before use
- Restrict where possible

---

## 9. Admin Panel Security

### Rules

- Admin routes must be protected
- Use server-side role checks
- Separate admin UI from public UI
- Avoid exposing admin APIs to public routes
- Log important admin actions

---

## 10. Logging & Monitoring

### Track

- login attempts  
- failed requests  
- suspicious activity  
- admin actions  

### Rule

If you cannot see what is happening, you cannot secure it.

---

## 11. Dependency Security

### Rules

- Avoid unnecessary packages
- Keep dependencies updated
- Review unknown packages before installing
- Remove unused dependencies

---

## 12. Performance vs Security

Never sacrifice security for speed.

If needed:
- simplify UI instead of removing security checks
- optimize code instead of bypassing validation

---

## 13. Basic Hardening Checklist

Before deployment:

- [ ] No secrets in client-side code  
- [ ] All env variables configured properly  
- [ ] Admin routes protected  
- [ ] Input validation in place  
- [ ] Forms protected against spam  
- [ ] File uploads restricted  
- [ ] API responses safe  
- [ ] Dependencies reviewed  
- [ ] Logging enabled  

---

## 14. Attack Awareness

Common risks:

- injection attacks  
- secret exposure  
- unauthorized access  
- spam/abuse  
- misconfigured permissions  

Always assume:

> "If something is exposed, it will be exploited."

---

## 15. Final Rule

Security is not a feature.

Security is a requirement.

If a change makes the system:

- less secure ❌  
- harder to control ❌  
- easier to exploit ❌  

It must not be shipped.