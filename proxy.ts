import { NextRequest, NextResponse } from "next/server";
import { defaultLocale, isValidLocale } from "@/lib/i18n/config";

const PUBLIC_FILE = /\.(.*)$/;
const isProd = process.env.NODE_ENV === "production";

// ─── Security Headers ─────────────────────────────────────────────────────────
//
// CSP is production-only: webpack dev server uses eval() for HMR, which
// 'unsafe-eval' would permit but which we deliberately exclude in production.
//
// 'unsafe-inline' in script-src is a known interim — JSON-LD blocks rendered
// via dangerouslySetInnerHTML require it until Phase 23 replaces them with
// per-request nonces generated here and threaded through the render pipeline.
//
// Domains whitelisted:
//   challenges.cloudflare.com  — Cloudflare Turnstile (script + iframe)
//   static.cloudflareinsights.com — Cloudflare Web Analytics beacon script
//   cloudflareinsights.com     — Analytics beacon POST target (connect-src)
//   *.r2.cloudflarestorage.com — R2 image/file CDN

const CSP_DIRECTIVES = [
  "default-src 'self'",
  // TODO Phase 23: replace 'unsafe-inline' with nonces, e.g.
  //   `script-src 'self' 'nonce-${nonce}' https://challenges.cloudflare.com ...`
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.r2.cloudflarestorage.com",
  "font-src 'self'",
  "connect-src 'self' https://challenges.cloudflare.com https://cloudflareinsights.com",
  "frame-src https://challenges.cloudflare.com",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "upgrade-insecure-requests",
].join("; ");

function applySecurityHeaders(response: NextResponse): void {
  // Applied in all environments — these do not conflict with local dev.
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()"
  );

  // Production-only: HSTS requires HTTPS; CSP requires no eval() in the bundle.
  if (isProd) {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
    response.headers.set("Content-Security-Policy", CSP_DIRECTIVES);
  }
}

// ─── TOTP enforcement note ─────────────────────────────────────────────────────
//
// Full TOTP-enrollment enforcement (redirect users with totp_enabled=false to
// /admin/account/2fa/setup) requires a DB query, which cannot run in middleware.
// That check lives in app/(admin)/admin/(shell)/layout.tsx, which wraps every
// authenticated admin shell page and has access to the session + user record.
//
// What this middleware CAN do: if a request carries the short-lived pending-2FA
// cookie but targets a real admin shell route, redirect to the challenge page so
// users who navigated away mid-login can complete their 2FA step.

const PENDING_2FA_COOKIE = "__Host-admin-2fa-pending";

// ─── CSRF: Origin/Referer check for state-changing requests ───────────────────
//
// Server Actions get CSRF protection from Next.js automatically. API routes do
// not — we enforce same-origin here for any non-GET/HEAD request to /api/*.
// Cron endpoints are exempt because they use bearer-token auth.

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function checkCsrf(request: NextRequest): NextResponse | null {
  if (SAFE_METHODS.has(request.method)) return null;
  if (!request.nextUrl.pathname.startsWith("/api/")) return null;
  if (request.nextUrl.pathname.startsWith("/api/cron/")) return null;

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const host = request.headers.get("host");

  if (!host) {
    return NextResponse.json({ error: "Missing host header" }, { status: 400 });
  }

  const allowedOrigins = [
    `https://${host}`,
    `http://${host}`,
    process.env.NEXT_PUBLIC_SITE_URL,
  ].filter(Boolean) as string[];

  const source = origin || referer;
  if (!source) {
    return NextResponse.json({ error: "Missing origin" }, { status: 403 });
  }

  const isAllowed = allowedOrigins.some((allowed) => source.startsWith(allowed));
  if (!isAllowed) {
    return NextResponse.json({ error: "Cross-origin denied" }, { status: 403 });
  }

  return null;
}

// ─── Proxy ────────────────────────────────────────────────────────────────────

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const csrfFail = checkCsrf(request);
  if (csrfFail) {
    applySecurityHeaders(csrfFail);
    return csrfFail;
  }

  // If a pending-2FA cookie exists and the request is for an admin shell route
  // (not the challenge page itself, not login, not the 2FA setup page), redirect
  // to the challenge page so the user can complete their second factor.
  const hasPending2fa = request.cookies.has(PENDING_2FA_COOKIE);
  if (
    hasPending2fa &&
    pathname.startsWith("/admin") &&
    pathname !== "/admin/totp-challenge" &&
    pathname !== "/admin/login" &&
    !pathname.startsWith("/admin/account/2fa")
  ) {
    const response = NextResponse.redirect(
      new URL("/admin/totp-challenge", request.url),
      302
    );
    applySecurityHeaders(response);
    return response;
  }

  // Static files, Next internals, API routes, admin — skip locale processing
  // but still apply security headers on the way out.
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    const response = NextResponse.next();
    applySecurityHeaders(response);
    return response;
  }

  // Root → /bn (or locale_pref cookie)
  if (pathname === "/") {
    const cookieLocale = request.cookies.get("locale_pref")?.value;
    const target =
      cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale;
    const response = NextResponse.redirect(
      new URL(`/${target}`, request.url),
      302
    );
    applySecurityHeaders(response);
    return response;
  }

  // Detect locale from URL and pass to root layout via request header.
  const segments = pathname.split("/");
  const localeSegment = segments[1];
  const locale = isValidLocale(localeSegment) ? localeSegment : defaultLocale;

  const response = NextResponse.next();
  response.headers.set("x-locale", locale);
  applySecurityHeaders(response);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.json).*)"],
};
