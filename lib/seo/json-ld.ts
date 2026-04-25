/**
 * JSON-LD schema builders for structured data.
 * All functions return a plain object; render with <script type="application/ld+json">.
 */

import type { Locale } from "@/lib/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

// ─── Organization ─────────────────────────────────────────────────────────────

export function organizationJsonLd(options: {
  siteName: string;
  url?: string;
  contactEmail?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: options.siteName,
    url: options.url ?? SITE_URL,
    ...(options.contactEmail && { email: options.contactEmail }),
  };
}

// ─── WebSite ──────────────────────────────────────────────────────────────────

export function websiteJsonLd(options: { siteName: string; locale: Locale }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: options.siteName,
    url: SITE_URL,
    inLanguage: options.locale,
  };
}

// ─── BreadcrumbList ──────────────────────────────────────────────────────────

export type BreadcrumbItem = { name: string; href?: string };

export function breadcrumbJsonLd(
  items: BreadcrumbItem[],
  locale: Locale
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      ...(item.href && { item: `${SITE_URL}/${locale}${item.href}` }),
    })),
  };
}

// ─── Article (NewsArticle / BlogPosting) ─────────────────────────────────────

export function articleJsonLd(options: {
  type: "blog" | "news";
  title: string;
  url: string;
  publishedAt: Date | null;
  locale: Locale;
  description?: string | null;
}) {
  const schemaType = options.type === "news" ? "NewsArticle" : "BlogPosting";
  return {
    "@context": "https://schema.org",
    "@type": schemaType,
    headline: options.title,
    url: options.url,
    inLanguage: options.locale,
    ...(options.description && { description: options.description }),
    ...(options.publishedAt && {
      datePublished: options.publishedAt.toISOString(),
    }),
  };
}

// ─── Campaign (Event-like) ────────────────────────────────────────────────────

export function campaignJsonLd(options: {
  title: string;
  url: string;
  locale: Locale;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: options.title,
    url: options.url,
    inLanguage: options.locale,
    ...(options.description && { description: options.description }),
    ...(options.startDate && { startDate: options.startDate }),
    ...(options.endDate && { endDate: options.endDate }),
  };
}
