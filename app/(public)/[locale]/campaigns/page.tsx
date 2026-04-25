import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getCampaignList } from "@/lib/data/public/campaigns";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/public/section-header";
import { CampaignCard } from "@/components/public/campaign-card";

interface CampaignsListPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: CampaignsListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/campaigns",
    title: dict.nav.campaigns,
    siteName: settings?.siteName,
  });
}

export default function CampaignsListPage({
  params,
}: CampaignsListPageProps) {
  return (
    <Suspense fallback={null}>
      <CampaignsListContent params={params} />
    </Suspense>
  );
}

async function CampaignsListContent({
  params,
}: CampaignsListPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const campaigns = await getCampaignList(locale, 24);

  const active = campaigns.filter((c) => c.statusLifecycle === "active");
  const past = campaigns.filter((c) => c.statusLifecycle === "past");

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: dict.nav.campaigns }],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <Container className="py-12 sm:py-16">
        <SectionHeader title={dict.nav.campaigns} />

        {active.length > 0 && (
          <section className="mb-14">
            <h2 className="mb-6 text-xl font-semibold text-[--color-text-primary]">
              Active
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {active.map((c) => (
                <CampaignCard key={c.id} campaign={c} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {past.length > 0 && (
          <section>
            <h2 className="mb-6 text-xl font-semibold text-[--color-text-primary]">
              Past
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((c) => (
                <CampaignCard key={c.id} campaign={c} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {campaigns.length === 0 && (
          <p className="text-[--color-text-muted]">—</p>
        )}
      </Container>
    </>
  );
}
