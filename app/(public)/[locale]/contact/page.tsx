import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getPage } from "@/lib/data/public/pages";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/public/prose";
import { NotTranslated } from "@/components/public/not-translated";
import { SubmissionForm } from "@/components/public/submission-form";

interface ContactPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("contact", locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/contact",
    title: page?.seoTitle ?? page?.title ?? dict.nav.contact,
    description: page?.metaDescription,
    siteName: settings?.siteName,
  });
}

export default function ContactPage({ params }: ContactPageProps) {
  return (
    <Suspense fallback={null}>
      <ContactContent params={params} />
    </Suspense>
  );
}

async function ContactContent({ params }: ContactPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("contact", locale);
  const settings = await getSiteSettings(locale);

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: dict.nav.contact }],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <section className="border-b border-[--color-border] bg-[--color-brand-black] py-16">
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            {page?.title ?? dict.nav.contact}
          </h1>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_320px]">
          {/* Left: page content or fallback */}
          <div>
            {page?.body ? (
              <Prose html={page.body} />
            ) : (
              <NotTranslated
                locale={locale}
                dict={dict}
                availableLocales={[]}
                path="/contact"
              />
            )}

            {/* Contact + advisory submission forms */}
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <SubmissionForm kind="contact" locale={locale} />
              <SubmissionForm kind="advisory" locale={locale} />
            </div>
          </div>

          {/* Right: contact info sidebar */}
          <aside className="space-y-6 text-sm">
            {settings?.contactEmail && (
              <div>
                <p className="font-semibold text-[--color-text-primary]">
                  Email
                </p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="mt-1 block text-[--color-brand-deep] hover:underline"
                >
                  {settings.contactEmail}
                </a>
              </div>
            )}

            {settings?.contactPhone && (
              <div>
                <p className="font-semibold text-[--color-text-primary]">
                  Phone
                </p>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="mt-1 block text-[--color-brand-deep] hover:underline"
                >
                  {settings.contactPhone}
                </a>
              </div>
            )}

            {settings?.address && (
              <div>
                <p className="font-semibold text-[--color-text-primary]">
                  Address
                </p>
                <p className="mt-1 text-[--color-text-secondary]">
                  {settings.address}
                </p>
              </div>
            )}

            {settings?.socials && settings.socials.length > 0 && (
              <div>
                <p className="font-semibold text-[--color-text-primary]">
                  Social
                </p>
                <ul className="mt-2 space-y-1">
                  {settings.socials.map((s) => (
                    <li key={s.platform}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[--color-brand-deep] hover:underline"
                      >
                        {s.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </Container>
    </>
  );
}
