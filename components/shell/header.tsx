import { Suspense } from "react";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";

interface HeaderProps {
  locale: Locale;
  dict: Dictionary;
}

export function Header({ locale, dict }: HeaderProps) {
  const navItems = [
    { href: `/${locale}/about`, label: dict.nav.about },
    { href: `/${locale}/leadership`, label: dict.nav.leadership },
    { href: `/${locale}/campaigns`, label: dict.nav.campaigns },
    { href: `/${locale}/news`, label: dict.nav.news },
    { href: `/${locale}/blog`, label: dict.nav.blog },
    { href: `/${locale}/resources`, label: dict.nav.resources },
    { href: `/${locale}/contact`, label: dict.nav.contact },
  ];

  return (
    <header className="sticky top-0 z-40 bg-brand-black/95 backdrop-blur-sm border-b border-white/8">
      <Container>
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo / wordmark */}
          <Link
            href={`/${locale}`}
            className="shrink-0 text-base font-semibold tracking-tight text-white transition-opacity hover:opacity-80"
          >
            Sovereignty
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-6"
            aria-label="Main navigation"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-white/80 transition-colors hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop locale switcher — wrapped in Suspense: usePathname() is request-time data */}
          <div className="hidden md:block shrink-0">
            <Suspense fallback={null}>
              <LanguageSwitcher currentLocale={locale} dict={dict} />
            </Suspense>
          </div>

          {/* Mobile hamburger — wrapped in Suspense */}
          <Suspense fallback={null}>
            <MobileMenu locale={locale} dict={dict} navItems={navItems} />
          </Suspense>
        </div>
      </Container>
    </header>
  );
}
