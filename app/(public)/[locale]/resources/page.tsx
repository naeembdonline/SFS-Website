import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getResourceList } from "@/lib/data/public/resources";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/public/section-header";
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
    siteName: settings?.siteName,
  });
}

export default function ResourcesPage({ params }: ResourcesPageProps) {
  return (
    <Suspense fallback={null}>
      <ResourcesContent params={params} />
    </Suspense>
  );
}

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

      <Container className="py-12 sm:py-16">
        <SectionHeader title={dict.nav.resources} />

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
          <p className="text-[--color-text-muted]">—</p>
        )}
      </Container>
    </>
  );
}
