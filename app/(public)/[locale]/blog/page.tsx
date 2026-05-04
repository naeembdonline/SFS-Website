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
    siteName: settings?.siteName ?? "Sovereignty",
  });
}

export default function BlogListPage({ params }: BlogListPageProps) {
  return (
    <Suspense fallback={null}>
      <BlogListContent params={params} />
    </Suspense>
  );
}

const PAGE_SUBTITLES: Record<Locale, string> = {
  bn: "আমাদের বিশ্লেষণ, মতামত ও চিন্তাভাবনা",
  en: "Our analysis, opinions and perspectives",
  ar: "تحليلاتنا وآراؤنا ووجهات نظرنا",
};

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

      {/* Page header */}
      <section
        className="border-b py-16 sm:py-20"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <h1 className="text-4xl font-bold text-white sm:text-5xl">{dict.nav.blog}</h1>
          <p className="mt-3 text-lg text-white/60">{PAGE_SUBTITLES[locale]}</p>
        </Container>
      </section>

      <Container className="py-14 sm:py-20">
        {posts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} type="blog" locale={locale} />
            ))}
          </div>
        ) : (
          <p className="py-10 text-center text-neutral-400">—</p>
        )}
      </Container>
    </>
  );
}
