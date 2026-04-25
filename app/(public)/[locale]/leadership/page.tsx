import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getLeadershipMembers } from "@/lib/data/public/leadership";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/public/section-header";
import { LeadershipCard } from "@/components/public/leadership-card";

interface LeadershipPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: LeadershipPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/leadership",
    title: dict.nav.leadership,
    siteName: settings?.siteName,
  });
}

export default function LeadershipPage({ params }: LeadershipPageProps) {
  return (
    <Suspense fallback={null}>
      <LeadershipContent params={params} />
    </Suspense>
  );
}

async function LeadershipContent({ params }: LeadershipPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const members = await getLeadershipMembers(locale);

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: dict.nav.leadership }],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <Container className="py-12 sm:py-16">
        <SectionHeader title={dict.nav.leadership} />

        {members.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <LeadershipCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="text-[--color-text-muted]">—</p>
        )}
      </Container>
    </>
  );
}
