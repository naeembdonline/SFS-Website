/**
 * Fallback notice shown when a content item has not been translated into
 * the requested locale. Returns HTTP 200 — never a 404.
 * Per Phase 3 decision: no auto-translate, no silent wrong-locale substitution.
 */

import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";

interface NotTranslatedProps {
  locale: Locale;
  dict: Dictionary;
  /** Locales that have a published translation for this content */
  availableLocales: Locale[];
  /** Base path without locale prefix, e.g. "/blog/my-post" */
  path: string;
  /**
   * Override per-locale full paths (e.g. when slugs differ across locales).
   * Falls back to `/${loc}${path}` if not provided for a given locale.
   */
  localePaths?: Partial<Record<Locale, string>>;
}

export function NotTranslated({
  locale,
  dict,
  availableLocales,
  path,
  localePaths,
}: NotTranslatedProps) {
  void locale; // consumed by parent; passed for future locale-specific rendering

  return (
    <div
      className="mx-auto max-w-2xl px-4 py-20 text-center"
      role="status"
      aria-live="polite"
    >
      <p className="text-2xl font-semibold text-[--color-text-primary]">
        {dict.fallback.title}
      </p>
      <p className="mt-3 text-[--color-text-muted]">
        {dict.fallback.message}
      </p>

      {availableLocales.length > 0 && (
        <ul className="mt-6 flex flex-wrap justify-center gap-3">
          {availableLocales.map((loc) => (
            <li key={loc}>
              <Link
                href={localePaths?.[loc] ?? `/${loc}${path}`}
                className="inline-flex items-center gap-1.5 rounded-full border border-[--color-brand-deep] px-4 py-1.5 text-sm font-medium text-[--color-brand-deep] transition-colors hover:bg-[--color-brand-deep] hover:text-white"
              >
                {dict.fallback.viewIn}{" "}
                <span lang={loc}>{dict.locale[loc]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
