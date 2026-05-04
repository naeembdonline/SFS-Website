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
    siteName: settings?.siteName ?? "Sovereignty",
  });
}

export default function ContactPage({ params }: ContactPageProps) {
  return (
    <Suspense fallback={null}>
      <ContactContent params={params} />
    </Suspense>
  );
}

const CONTACT_LABELS: Record<Locale, { email: string; phone: string; address: string; social: string }> = {
  bn: { email: "ইমেইল", phone: "ফোন", address: "ঠিকানা", social: "সোশ্যাল মিডিয়া" },
  en: { email: "Email", phone: "Phone", address: "Address", social: "Social Media" },
  ar: { email: "البريد الإلكتروني", phone: "الهاتف", address: "العنوان", social: "وسائل التواصل الاجتماعي" },
};

async function ContactContent({ params }: ContactPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const page = await getPage("contact", locale);
  const settings = await getSiteSettings(locale);
  const labels = CONTACT_LABELS[locale] ?? CONTACT_LABELS.en;

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

      {/* Dark header */}
      <section
        className="border-b py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">
            {page?.title ?? dict.nav.contact}
          </h1>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-[1fr_300px]">

          {/* Left: page content + forms */}
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

            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <SubmissionForm kind="contact" locale={locale} />
              <SubmissionForm kind="advisory" locale={locale} />
            </div>
          </div>

          {/* Right: contact info sidebar */}
          <aside className="space-y-6 text-sm">

            {settings?.contactEmail && (
              <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  {labels.email}
                </p>
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="font-semibold text-sm transition-colors hover:underline"
                  style={{ color: "var(--color-brand-deep)" }}
                >
                  {settings.contactEmail}
                </a>
              </div>
            )}

            {settings?.contactPhone && (
              <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  {labels.phone}
                </p>
                <a
                  href={`tel:${settings.contactPhone}`}
                  className="font-semibold text-sm transition-colors hover:underline"
                  style={{ color: "var(--color-brand-deep)" }}
                >
                  {settings.contactPhone}
                </a>
              </div>
            )}

            {settings?.address && (
              <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-2">
                  {labels.address}
                </p>
                <p className="text-sm text-neutral-600 leading-relaxed">
                  {settings.address}
                </p>
              </div>
            )}

            {settings?.socials && settings.socials.length > 0 && (
              <div className="rounded-xl border bg-white p-5 shadow-sm" style={{ borderColor: "#e5e7eb" }}>
                <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
                  {labels.social}
                </p>
                <ul className="space-y-2">
                  {settings.socials.map((s) => (
                    <li key={s.platform}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold transition-colors hover:underline"
                        style={{ color: "var(--color-brand-deep)" }}
                      >
                        {s.platform} →
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
