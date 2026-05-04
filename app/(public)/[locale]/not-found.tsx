/**
 * Locale-aware 404 page.
 * Note: Next.js renders the nearest not-found.tsx for the segment.
 * This file catches 404s within the [locale] route group.
 */

import Link from "next/link";

export default function LocaleNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p
        className="text-6xl font-bold"
        style={{ color: "var(--color-brand-deep)" }}
      >
        404
      </p>
      <h1 className="mt-4 text-2xl font-semibold text-neutral-900">
        Page not found
      </h1>
      <p className="mt-2 text-neutral-500">
        The page you are looking for does not exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-lg px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--color-brand-deep)" }}
      >
        Go home
      </Link>
    </div>
  );
}
