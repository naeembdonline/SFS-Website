import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getPostBySlug, getPostLocalesBySlug } from "@/lib/data/public/posts";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { articleJsonLd, breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Prose } from "@/components/public/prose";
import { NotTranslated } from "@/components/public/not-translated";

interface BlogDetailPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const post = await getPostBySlug("blog", slug, locale);
  const settings = await getSiteSettings(locale);

  if (!post) return { title: "Not found" };

  return buildMetadata({
    locale,
    path: `/blog/${slug}`,
    title: post.seoTitle ?? post.title,
    description: post.metaDescription ?? post.excerpt,
    ogTitle: post.ogTitle,
    ogDescription: post.ogDescription,
    siteName: settings?.siteName,
    publishedAt: post.publishedAt,
    ogType: "article",
  });
}

// ─── Content component — runs fully inside Suspense ───────────────────────────

async function BlogDetailContent({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const post = await getPostBySlug("blog", slug, locale);

  if (!post) {
    const fallback = await getPostLocalesBySlug("blog", slug);
    if (!fallback) notFound();
    const localePaths = Object.fromEntries(
      fallback.map(({ locale: loc, slug: s }) => [loc, `/${loc}/blog/${s}`])
    ) as Partial<Record<typeof locale, string>>;
    return (
      <NotTranslated
        locale={locale}
        dict={dict}
        availableLocales={fallback.map((f) => f.locale)}
        path={`/blog/${slug}`}
        localePaths={localePaths}
      />
    );
  }

  const articleLd = articleJsonLd({
    type: "blog",
    title: post.title,
    url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/${locale}/blog/${slug}`,
    publishedAt: post.publishedAt,
    locale,
    description: post.excerpt,
  });

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: "Home", href: "" },
      { name: dict.nav.blog, href: "/blog" },
      { name: post.title },
    ],
    locale
  );

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleLd, breadcrumb]),
        }}
      />

      <section
        className="border-b py-14"
        style={{ backgroundColor: "var(--color-brand-black)", borderColor: "rgba(255,255,255,0.08)" }}
      >
        <Container>
          <div className="max-w-3xl">
            <p
              className="mb-3 text-xs font-semibold uppercase tracking-widest"
              style={{ color: "var(--color-accent-gold)" }}
            >
              {dict.nav.blog}
              {post.publishedAt && (
                <>
                  {" · "}
                  <time dateTime={post.publishedAt.toISOString()}>
                    {post.publishedAt.toLocaleDateString(locale, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </time>
                </>
              )}
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {post.title}
            </h1>
            {post.excerpt && (
              <p className="mt-4 text-lg text-white/70">{post.excerpt}</p>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl">
          {post.availableLocales.length > 0 && (
            <NotTranslated
              locale={locale}
              dict={dict}
              availableLocales={post.availableLocales}
              path={`/blog/${slug}`}
            />
          )}
          <Prose html={post.body} />
        </div>
      </Container>
    </>
  );
}

// ─── Page shell ───────────────────────────────────────────────────────────────

export default function BlogDetailPage({ params }: BlogDetailPageProps) {
  return (
    <Suspense fallback={null}>
      <BlogDetailContent params={params} />
    </Suspense>
  );
}
