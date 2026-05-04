import Link from "next/link";
import { Container } from "@/components/ui/container";
import type { Locale } from "@/lib/i18n/config";
import type { Dictionary } from "@/lib/i18n/dict";
import { getSiteSettings } from "@/lib/data/public/settings";

interface FooterProps {
  locale: Locale;
  dict: Dictionary;
}

const currentYear = new Date().getFullYear();

export async function Footer({ locale, dict }: FooterProps) {
  const settings = await getSiteSettings(locale);
  const siteName = settings?.siteName ?? "Sovereignty";

  return (
    <footer
      className="border-t"
      style={{
        backgroundColor: "var(--color-brand-black)",
        borderColor: "rgba(255,255,255,0.08)",
      }}
    >
      <Container>
        {/* Main grid */}
        <div className="grid grid-cols-1 gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="flex flex-col gap-4 lg:col-span-1">
            <Link
              href={`/${locale}`}
              className="text-xl font-bold text-white transition-opacity hover:opacity-80"
            >
              {siteName}
            </Link>
            {settings?.tagline && (
              <p className="text-sm leading-relaxed text-white/50 max-w-xs">
                {settings.tagline}
              </p>
            )}
            {/* Socials */}
            {settings?.socials && settings.socials.length > 0 && (
              <div className="flex flex-wrap gap-3 mt-2">
                {settings.socials.map((s) => (
                  <a
                    key={s.platform}
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-white/40 transition-colors hover:text-white/80"
                  >
                    {s.platform}
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Organization */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">
              {locale === "ar" ? "المنظمة" : locale === "en" ? "Organization" : "সংগঠন"}
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
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">
              {locale === "ar" ? "المحتوى" : locale === "en" ? "Content" : "বিষয়বস্তু"}
            </span>
            <nav aria-label="Footer content links">
              <ul className="flex flex-col gap-2">
                {[
                  { href: `/${locale}/campaigns`, label: dict.nav.campaigns },
                  { href: `/${locale}/news`, label: dict.nav.news },
                  { href: `/${locale}/blog`, label: dict.nav.blog },
                  { href: `/${locale}/resources`, label: dict.nav.resources },
                ].map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-3">
            <span className="text-xs font-bold uppercase tracking-widest text-white/30 mb-1">
              {locale === "ar" ? "التواصل" : locale === "en" ? "Contact" : "যোগাযোগ"}
            </span>
            <div className="flex flex-col gap-2 text-sm text-white/55">
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="transition-colors hover:text-white"
                >
                  {settings.contactEmail}
                </a>
              )}
              {settings?.contactPhone && (
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="transition-colors hover:text-white"
                >
                  {settings.contactPhone}
                </a>
              )}
              {settings?.address && (
                <p className="text-white/40">{settings.address}</p>
              )}
            </div>
          </div>
        </div>

        {/* Bottom strip */}
        <div
          className="flex flex-col gap-3 border-t py-6 sm:flex-row sm:items-center sm:justify-between"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <p className="text-xs text-white/35">
            © {currentYear} {siteName}. {dict.footer.rights}.
          </p>
          <nav aria-label="Legal links">
            <ul className="flex items-center gap-5">
              <li>
                <Link
                  href={`/${locale}/privacy`}
                  className="text-xs text-white/35 transition-colors hover:text-white/65"
                >
                  {dict.footer.privacy}
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/terms`}
                  className="text-xs text-white/35 transition-colors hover:text-white/65"
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
