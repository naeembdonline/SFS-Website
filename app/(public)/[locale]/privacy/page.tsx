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

interface PrivacyPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("privacy", locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/privacy",
    title: page?.seoTitle ?? page?.title ?? dict.footer.privacy,
    description: page?.metaDescription,
    siteName: settings?.siteName,
  });
}

export default function PrivacyPage({ params }: PrivacyPageProps) {
  return (
    <Suspense fallback={null}>
      <PrivacyContent params={params} />
    </Suspense>
  );
}

async function PrivacyContent({ params }: PrivacyPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("privacy", locale);

  return (
    <>
      <section
        className="border-b py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            {page?.title ?? dict.footer.privacy}
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
              path="/privacy"
            />
          )}
        </div>
      </Container>
    </>
  );
}
