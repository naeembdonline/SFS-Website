"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales, type Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";
import { cn } from "@/lib/utils/cn";

const localeLabels: Record<Locale, string> = {
  bn: "বাংলা",
  en: "English",
  ar: "العربية",
};

interface LanguageSwitcherProps {
  currentLocale: Locale;
  dict: Dictionary;
}

export function LanguageSwitcher({ currentLocale, dict }: LanguageSwitcherProps) {
  const pathname = usePathname();
  const router = useRouter();

  function switchLocale(locale: Locale) {
    if (locale === currentLocale) return;

    // Replace the locale segment: /bn/about → /en/about
    const segments = pathname.split("/");
    segments[1] = locale;
    const newPath = segments.join("/") || "/";

    router.push(newPath);
  }

  return (
    <nav aria-label={dict.locale.switchTo}>
      <ul className="flex items-center gap-1" role="list">
        {locales.map((locale, i) => (
          <li key={locale} className="flex items-center">
            {i > 0 && (
              <span className="mx-1 select-none text-white/30" aria-hidden="true">
                |
              </span>
            )}
            <button
              onClick={() => switchLocale(locale)}
              lang={locale}
              aria-current={locale === currentLocale ? "true" : undefined}
              className={cn(
                "text-sm transition-colors",
                locale === currentLocale
                  ? "font-semibold text-white underline underline-offset-4"
                  : "text-white/70 hover:text-white"
              )}
            >
              {localeLabels[locale]}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
