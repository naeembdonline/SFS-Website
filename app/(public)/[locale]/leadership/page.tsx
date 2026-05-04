import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getLeadershipMembers } from "@/lib/data/public/leadership";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
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
    siteName: settings?.siteName ?? "Sovereignty",
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

  const subtitle: Record<Locale, string> = {
    bn: "আমাদের অভিজ্ঞ ও নিবেদিতপ্রাণ নেতৃবৃন্দ যারা দেশের জন্য অক্লান্তভাবে কাজ করে যাচ্ছেন",
    en: "Our experienced and dedicated leaders who work tirelessly for the country",
    ar: "قادتنا ذوو الخبرة والتفاني الذين يعملون بلا كلل من أجل البلاد",
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      {/* Page header */}
      <section
        className="border-b py-10 sm:py-14"
        style={{
          backgroundColor: "var(--color-brand-black)",
          borderColor: "rgba(255,255,255,0.08)",
        }}
      >
        <Container>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">
            {dict.nav.leadership}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-white/60">
            {subtitle[locale]}
          </p>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        {members.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <LeadershipCard key={member.id} member={member} />
            ))}
          </div>
        ) : (
          <p className="text-neutral-400">—</p>
        )}
      </Container>
    </>
  );
}
