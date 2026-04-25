import { notFound } from "next/navigation";
import { isValidLocale, isRtl, locales, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { Header } from "@/components/shell/header";
import { Footer } from "@/components/shell/footer";
import { SkipLink } from "@/components/shell/skip-link";

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

/**
 * Generate static params for the three supported locales.
 * This makes all pages under [locale] statically generated at build time.
 * Pages with additional dynamic segments (e.g. [slug]) remain dynamic.
 */
export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale: raw } = await params;

  if (!isValidLocale(raw)) notFound();

  const locale = raw as Locale;
  const dict = await getDictionary(locale);
  const dir = isRtl(locale) ? "rtl" : "ltr";

  return (
    // lang + dir on the wrapper so CSS :lang() selectors and Tailwind logical
    // properties (ms-*, me-*, ps-*, pe-*) work correctly for each locale.
    <div lang={locale} dir={dir} className="flex min-h-svh flex-col">
      <SkipLink dict={dict} />
      <Header locale={locale} dict={dict} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <Footer locale={locale} dict={dict} />
    </div>
  );
}
