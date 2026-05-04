import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getPage } from "@/lib/data/public/pages";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/public/prose";
import { NotTranslated } from "@/components/public/not-translated";

interface AboutPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: AboutPageProps): Promise<Metadata> {
  const { locale } = await params;
  const page = await getPage("about", locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/about",
    title: page?.seoTitle ?? page?.title ?? "About",
    description: page?.metaDescription,
    ogTitle: page?.ogTitle,
    ogDescription: page?.ogDescription,
    siteName: settings?.siteName,
  });
}

export default function AboutPage({ params }: AboutPageProps) {
  return (
    <Suspense fallback={null}>
      <AboutContent params={params} />
    </Suspense>
  );
}

async function AboutContent({ params }: AboutPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("about", locale);

  if (!page) {
    // Content not yet translated into this locale — 200 fallback (Phase 3 decision)
    return (
      <Container className="py-16">
        <NotTranslated
          locale={locale}
          dict={dict}
          availableLocales={[]}
          path="/about"
        />
      </Container>
    );
  }

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: page.title }],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section
        className="border-b py-10 sm:py-14"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {page.title}
          </h1>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        {page.body ? (
          <div className="max-w-3xl">
            <Prose html={page.body} />
          </div>
        ) : (
          <NotTranslated
            locale={locale}
            dict={dict}
            availableLocales={[]}
            path="/about"
          />
        )}
      </Container>
    </>
  );
}

// Suppress TS warning — notFound imported for future use
void notFound;
