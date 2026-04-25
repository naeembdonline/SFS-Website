/**
 * Catch-all route — resolves slug redirects for old URLs.
 *
 * With cacheComponents, `path` is a truly dynamic segment (unknown at build
 * time), so ALL work — including awaiting params — runs inside <Suspense> to
 * comply with the blocking-route constraint.
 *
 * Flow:
 *  1. Check slug_redirects table for a matching old slug
 *  2. If found, redirect to the current live slug (301)
 *  3. If not found, 404
 */

import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { getSlugRedirectTarget } from "@/lib/data/public/redirects";
import type { Locale } from "@/lib/i18n/config";

interface CatchAllPageProps {
  params: Promise<{ locale: Locale; path: string[] }>;
}

// ─── Resolver — async server component that runs fully inside Suspense ────────

async function RedirectResolver({
  params,
}: {
  params: Promise<{ locale: Locale; path: string[] }>;
}): Promise<never> {
  const { locale, path } = await params;

  // Only handle single-segment paths — multi-segment are genuine 404s
  if (path.length !== 1) notFound();

  const oldSlug = path[0];

  const target = await getSlugRedirectTarget(oldSlug, locale);

  if (target) redirect(target);
  notFound();
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function CatchAllPage({ params }: CatchAllPageProps) {
  // Everything — including await params — runs inside Suspense.
  // The static shell (from the locale layout) renders immediately;
  // the redirect/404 resolution streams in from the server.
  return (
    <Suspense fallback={null}>
      <RedirectResolver params={params} />
    </Suspense>
  );
}
