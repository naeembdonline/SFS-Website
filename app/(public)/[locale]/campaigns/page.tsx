import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getCampaignList } from "@/lib/data/public/campaigns";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { CampaignCard } from "@/components/public/campaign-card";

interface CampaignsListPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: CampaignsListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);
  return buildMetadata({ locale, path: "/campaigns", title: dict.nav.campaigns, siteName: settings?.siteName ?? "Sovereignty" });
}

export default function CampaignsListPage({ params }: CampaignsListPageProps) {
  return <Suspense fallback={null}><CampaignsListContent params={params} /></Suspense>;
}

const PAGE_SUBTITLES: Record<Locale, string> = {
  bn: "আমাদের চলমান ও সমাপ্ত প্রচারাভিযান সমূহ",
  en: "Our ongoing and completed campaigns",
  ar: "حملاتنا الجارية والمكتملة",
};

const ACTIVE_LABEL: Record<Locale, string> = {
  bn: "চলমান প্রচারাভিযান",
  en: "Active Campaigns",
  ar: "الحملات النشطة",
};

const PAST_LABEL: Record<Locale, string> = {
  bn: "সমাপ্ত প্রচারাভিযান",
  en: "Past Campaigns",
  ar: "الحملات السابقة",
};

async function CampaignsListContent({ params }: CampaignsListPageProps) {
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      {/* Page header */}
      <section
        className="border-b py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{dict.nav.campaigns}</h1>
          <p className="mt-3 text-lg text-white/60">{PAGE_SUBTITLES[locale]}</p>
        </Container>
      </section>

      <Container className="py-14 sm:py-20 space-y-16">
        {active.length > 0 && (
          <section>
            <h2
              className="mb-8 text-2xl font-bold"
              style={{ color: "var(--color-brand-black)" }}
            >
              {ACTIVE_LABEL[locale]}
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
            <h2 className="mb-8 text-2xl font-bold text-neutral-400">
              {PAST_LABEL[locale]}
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {past.map((c) => (
                <CampaignCard key={c.id} campaign={c} locale={locale} />
              ))}
            </div>
          </section>
        )}

        {campaigns.length === 0 && (
          <p className="py-10 text-center text-neutral-400">—</p>
        )}
      </Container>
    </>
  );
}
