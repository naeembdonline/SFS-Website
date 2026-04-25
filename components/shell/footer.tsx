import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

const currentYear = new Date().getFullYear();

export function Footer({ locale, dict }: FooterProps) {
  return (
    <footer className="bg-brand-black border-t border-white/8">
      <Container>
        {/* Main footer grid */}
        <div className="grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-3">
          {/* Identity */}
          <div className="flex flex-col gap-3">
            <span className="text-base font-semibold text-white">Sovereignty</span>
            <p className="text-sm leading-relaxed text-white/60 max-w-xs">
              {/* Site tagline rendered from settings in a future phase */}
            </p>
          </div>

          {/* Organization links */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-white/40">
              {/* Section heading — future: from settings */}
            </span>
            <nav aria-label="Footer organization links">
              <ul className="flex flex-col gap-2">
                {[
                  { href: `/${locale}/about`, label: dict.nav.about },
                  { href: `/${locale}/leadership`, label: dict.nav.leadership },
                  { href: `/${locale}/contact`, label: dict.nav.contact },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Publishing links */}
          <div className="flex flex-col gap-3">
            <nav aria-label="Footer publishing links">
              <ul className="flex flex-col gap-2">
                {[
                  { href: `/${locale}/news`, label: dict.nav.news },
                  { href: `/${locale}/blog`, label: dict.nav.blog },
                  { href: `/${locale}/campaigns`, label: dict.nav.campaigns },
                  { href: `/${locale}/resources`, label: dict.nav.resources },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>

        {/* Bottom strip */}
        <div className="flex flex-col gap-2 border-t border-white/8 py-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/40">
            © {currentYear} Sovereignty. {dict.footer.rights}.
          </p>
          <nav aria-label="Legal links">
            <ul className="flex items-center gap-4">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  {dict.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-xs text-white/40 transition-colors hover:text-white/70"
                >
                  {dict.footer.terms}
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
