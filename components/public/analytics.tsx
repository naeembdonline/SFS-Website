"use client";

import Script from "next/script";

/**
 * Cloudflare Web Analytics (Cookieless).
 *
 * This component injects the Cloudflare Beacon script.
 * It is privacy-compliant and does not use cookies.
 */
export function Analytics() {
  const token = process.env.NEXT_PUBLIC_CLOUDFLARE_ANALYTICS_TOKEN;

  if (process.env.NODE_ENV !== "production" || !token) {
    return null;
  }

  return (
    <Script
      src="https://static.cloudflareinsights.com/beacon.min.js"
      data-cf-beacon={`{"token": "${token}"}`}
      strategy="afterInteractive"
    />
  );
}
