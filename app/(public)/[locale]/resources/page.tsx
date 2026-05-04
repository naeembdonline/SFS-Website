import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getResourceList } from "@/lib/data/public/resources";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { ResourceItem } from "@/components/public/resource-item";

interface ResourcesPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: ResourcesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);
  return buildMetadata({
    locale,
    path: "/resources",
    title: dict.nav.resources,
    siteName: settings?.siteName ?? "Sovereignty",
  });
}

export default function ResourcesPage({ params }: ResourcesPageProps) {
  return (
    <Suspense fallback={null}>
      <ResourcesContent params={params} />
    </Suspense>
  );
}

const PAGE_SUBTITLES: Record<Locale, string> = {
  bn: "প্রতিবেদন, নীতিমালা ও গুরুত্বপূর্ণ দলিলপত্র",
  en: "Reports, policies and important documents",
  ar: "التقارير والسياسات والوثائق المهمة",
};

async function ResourcesContent({ params }: ResourcesPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const resources = await getResourceList(locale, 50);

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: dict.nav.resources }],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Page header */}
      <section
        className="border-b py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{dict.nav.resources}</h1>
          <p className="mt-3 text-lg text-white/60">{PAGE_SUBTITLES[locale]}</p>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        {resources.length > 0 ? (
          <ul className="flex flex-col gap-3">
            {resources.map((resource) => (
              <ResourceItem
                key={resource.id}
                resource={resource}
                locale={locale}
              />
            ))}
          </ul>
        ) : (
          <p className="py-10 text-center text-neutral-400">—</p>
        )}
      </Container>
    </>
  );
}
