/**
 * SEO metadata builder for public pages.
 * Produces Next.js Metadata objects with full hreflang alternates.
 */

import type { Metadata } from "next";
import { locales } from "@/lib/i18n/config";
import type { Locale } from "@/lib/i18n/config";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MetadataInput {
  locale: Locale;
  /** Canonical path without locale prefix, e.g. "/blog/my-post" */
  path: string;
  title: string;
  description?: string | null;
  ogTitle?: string | null;
  ogDescription?: string | null;
  /** Absolute URL of OG image, or null for default */
  ogImage?: string | null;
  /** Site name from DB settings */
  siteName?: string;
  /** For article pages */
  publishedAt?: Date | null;
  /** Type for og:type — defaults to 'website' */
  ogType?: "website" | "article";
}

// ─── Builder ──────────────────────────────────────────────────────────────────

export function buildMetadata(input: MetadataInput): Metadata {
  const {
    locale,
    path,
    title,
    description,
    ogTitle,
    ogDescription,
    ogImage,
    siteName = "Sovereignty",
    publishedAt,
    ogType = "website",
  } = input;

  const canonical = `${SITE_URL}/${locale}${path}`;

  // Build hreflang alternates for all locales at the same path
  const languageAlternates: Record<string, string> = {};
  for (const loc of locales) {
    languageAlternates[loc] = `${SITE_URL}/${loc}${path}`;
  }
  // x-default points to the default locale (bn)
  languageAlternates["x-default"] = `${SITE_URL}/bn${path}`;

  const resolvedOgTitle = ogTitle ?? title;
  const resolvedOgDescription = ogDescription ?? description ?? "";

  const ogImages = ogImage
    ? [{ url: ogImage, width: 1200, height: 630, alt: resolvedOgTitle }]
    : [];

  return {
    title,
    description: description ?? undefined,
    alternates: {
      canonical,
      languages: languageAlternates,
    },
    openGraph: {
      type: ogType,
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      url: canonical,
      siteName,
      locale: locale === "ar" ? "ar_SA" : locale === "en" ? "en_US" : "bn_BD",
      ...(ogImages.length > 0 && { images: ogImages }),
      ...(ogType === "article" &&
        publishedAt && {
          publishedTime: publishedAt.toISOString(),
        }),
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedOgTitle,
      description: resolvedOgDescription,
      ...(ogImages.length > 0 && { images: [ogImages[0].url] }),
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}
