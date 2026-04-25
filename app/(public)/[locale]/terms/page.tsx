import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getPage } from "@/lib/data/public/pages";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/public/prose";
import { NotTranslated } from "@/components/public/not-translated";

interface TermsPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("terms", locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/terms",
    title: page?.seoTitle ?? page?.title ?? dict.footer.terms,
    description: page?.metaDescription,
    siteName: settings?.siteName,
  });
}

export default function TermsPage({ params }: TermsPageProps) {
  return (
    <Suspense fallback={null}>
      <TermsContent params={params} />
    </Suspense>
  );
}

async function TermsContent({ params }: TermsPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("terms", locale);

  return (
    <>
      <section className="border-b border-[--color-border] bg-[--color-brand-black] py-14">
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            {page?.title ?? dict.footer.terms}
          </h1>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl">
          {page?.body ? (
            <Prose html={page.body} />
          ) : (
            <NotTranslated
              locale={locale}
              dict={dict}
              availableLocales={[]}
              path="/terms"
            />
          )}
        </div>
      </Container>
    </>
  );
}
