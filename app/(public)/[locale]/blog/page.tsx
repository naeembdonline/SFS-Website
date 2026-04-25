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

interface BlogListPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: BlogListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const settings = await getSiteSettings(locale);

  return buildMetadata({
    locale,
    path: "/blog",
    title: dict.nav.blog,
    siteName: settings?.siteName,
  });
}

export default function BlogListPage({ params }: BlogListPageProps) {
  return (
    <Suspense fallback={null}>
      <BlogListContent params={params} />
    </Suspense>
  );
}

async function BlogListContent({ params }: BlogListPageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const posts = await getPostList("blog", locale, 24);

  const breadcrumb = breadcrumbJsonLd(
    [{ name: "Home", href: "" }, { name: dict.nav.blog }],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <Container className="py-12 sm:py-16">
        <SectionHeader title={dict.nav.blog} />

        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} type="blog" locale={locale} />
            ))}
          </div>
        ) : (
          <p className="text-[--color-text-muted]">—</p>
        )}
      </Container>
    </>
  );
}
