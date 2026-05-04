import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getPostList } from "@/lib/data/public/posts";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { PostCard } from "@/components/public/post-card";

interface NewsListPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({ params }: NewsListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);
  return buildMetadata({ locale, path: "/news", title: dict.nav.news, siteName: settings?.siteName ?? "Sovereignty" });
}

export default function NewsListPage({ params }: NewsListPageProps) {
  return <Suspense fallback={null}><NewsListContent params={params} /></Suspense>;
}

const PAGE_SUBTITLES: Record<Locale, string> = {
  bn: "সর্বশেষ সংবাদ ও আপডেট",
  en: "Latest news and updates",
  ar: "آخر الأخبار والتحديثات",
};

async function NewsListContent({ params }: NewsListPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const posts = await getPostList("news", locale, 24);

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: dict.nav.news }],
    locale
  );

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />

      <section
        className="border-b py-10 sm:py-14"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-2xl font-bold text-white sm:text-3xl">{dict.nav.news}</h1>
          <p className="mt-3 text-lg text-white/60">{PAGE_SUBTITLES[locale]}</p>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} type="news" locale={locale} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-neutral-400">—</p>
        )}
      </Container>
    </>
  );
}
