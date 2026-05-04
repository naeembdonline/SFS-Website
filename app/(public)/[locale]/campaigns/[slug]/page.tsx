import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getCampaignBySlug, getCampaignLocalesBySlug } from "@/lib/data/public/campaigns";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { campaignJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/public/prose";
import { NotTranslated } from "@/components/public/not-translated";

interface CampaignDetailPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({
  params,
}: CampaignDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const campaign = await getCampaignBySlug(slug, locale);
  const settings = await getSiteSettings(locale);

  if (!campaign) return { title: "Not found" };

  return buildMetadata({
    locale,
    path: `/campaigns/${slug}`,
    title: campaign.seoTitle ?? campaign.title,
    description: campaign.metaDescription ?? campaign.excerpt,
    ogTitle: campaign.ogTitle,
    ogDescription: campaign.ogDescription,
    siteName: settings?.siteName,
  });
}

// ─── Content component — runs fully inside Suspense ───────────────────────────

async function CampaignDetailContent({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const campaign = await getCampaignBySlug(slug, locale);

  if (!campaign) {
    const fallback = await getCampaignLocalesBySlug(slug);
    if (!fallback) notFound();
    const localePaths = Object.fromEntries(
      fallback.map(({ locale: loc, slug: s }) => [loc, `/${loc}/campaigns/${s}`])
    ) as Partial<Record<typeof locale, string>>;
    return (
      <NotTranslated
        locale={locale}
        dict={dict}
        availableLocales={fallback.map((f) => f.locale)}
        path={`/campaigns/${slug}`}
        localePaths={localePaths}
      />
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
  const campaignLd = campaignJsonLd({
    title: campaign.title,
    url: `${siteUrl}/${locale}/campaigns/${slug}`,
    locale,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    description: campaign.excerpt,
  });

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: "Home", href: "" },
      { name: dict.nav.campaigns, href: "/campaigns" },
      { name: campaign.title },
    ],
    locale
  );

  const isActive = campaign.statusLifecycle === "active";

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([campaignLd, breadcrumb]),
        }}
      />

      <section
        className="border-b py-14"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <div className="max-w-3xl">
            <div className="mb-3 flex items-center gap-3">
              <span
                className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide"
                style={
                  isActive
                    ? { backgroundColor: "rgba(46,204,113,0.15)", color: "#2ecc71" }
                    : { backgroundColor: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)" }
                }
              >
                {campaign.statusLifecycle}
              </span>
              {campaign.startDate && (
                <span className="text-xs text-white/50">
                  {campaign.startDate}
                  {campaign.endDate && ` – ${campaign.endDate}`}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {campaign.title}
            </h1>
            {campaign.excerpt && (
              <p className="mt-4 text-lg text-white/70">{campaign.excerpt}</p>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl">
          {campaign.availableLocales.length > 0 && (
            <NotTranslated
              locale={locale}
              dict={dict}
              availableLocales={campaign.availableLocales}
              path={`/campaigns/${slug}`}
            />
          )}
          <Prose html={campaign.body} />

          {campaign.goals && (
            <div
              className="mt-10 rounded-xl border p-6"
              style={{ borderColor: "rgba(11,61,46,0.3)", backgroundColor: "rgba(11,61,46,0.05)" }}
            >
              <h2
                className="mb-4 text-lg font-semibold"
                style={{ color: "var(--color-brand-deep)" }}
              >
                Goals
              </h2>
              <Prose html={campaign.goals} />
            </div>
          )}
        </div>
      </Container>
    </>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  return (
    <Suspense fallback={null}>
      <CampaignDetailContent params={params} />
    </Suspense>
  );
}
