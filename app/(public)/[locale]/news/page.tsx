import { Suspense } from "react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getPostList } from "@/lib/data/public/posts";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/public/section-header";
import { PostCard } from "@/components/public/post-card";

interface NewsListPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: NewsListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/news",
    title: dict.nav.news,
    siteName: settings?.siteName,
  });
}

export default function NewsListPage({ params }: NewsListPageProps) {
  return (
    <Suspense fallback={null}>
      <NewsListContent params={params} />
    </Suspense>
  );
}

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
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <Container className="py-12 sm:py-16">
        <SectionHeader title={dict.nav.news} />

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} type="news" locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-[--color-text-muted]">—</p>
        )}
      </Container>
    </>
  );
}
