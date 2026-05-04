import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getResourceBySlug, getResourceLocalesBySlug } from "@/lib/data/public/resources";
import { getSiteSettings } from "@/lib/data/public/settings";
import { buildMetadata } from "@/lib/seo/metadata";
import { breadcrumbJsonLd } from "@/lib/seo/json-ld";
import { Container } from "@/components/ui/container";
import { NotTranslated } from "@/components/public/not-translated";

interface ResourceDetailPageProps {
  params: Promise<{ locale: Locale; slug: string }>;
}

export async function generateMetadata({
  params,
}: ResourceDetailPageProps): Promise<Metadata> {
  const { locale, slug } = await params;
  const resource = await getResourceBySlug(slug, locale);
  const settings = await getSiteSettings(locale);

  if (!resource) return { title: "Not found" };

  return buildMetadata({
    locale,
    path: `/resources/${slug}`,
    title: resource.seoTitle ?? resource.title,
    description: resource.metaDescription ?? resource.description,
    ogTitle: resource.ogTitle,
    ogDescription: resource.ogDescription,
    siteName: settings?.siteName,
  });
}

export default function ResourceDetailPage({ params }: ResourceDetailPageProps) {
  return (
    <Suspense fallback={null}>
      <ResourceDetailContent params={params} />
    </Suspense>
  );
}

async function ResourceDetailContent({
  params,
}: {
  params: Promise<{ locale: Locale; slug: string }>;
}) {
  const { locale, slug } = await params;
  const dict = await getDictionary(locale);
  const resource = await getResourceBySlug(slug, locale);

  if (!resource) {
    const fallback = await getResourceLocalesBySlug(slug);
    if (!fallback) notFound();
    const localePaths = Object.fromEntries(
      fallback.map(({ locale: loc, slug: s }) => [loc, `/${loc}/resources/${s}`])
    ) as Partial<Record<typeof locale, string>>;
    return (
      <NotTranslated
        locale={locale}
        dict={dict}
        availableLocales={fallback.map((f) => f.locale)}
        path={`/resources/${slug}`}
        localePaths={localePaths}
      />
    );
  }

  const breadcrumb = breadcrumbJsonLd(
    [
      { name: "Home", href: "" },
      { name: dict.nav.resources, href: "/resources" },
      { name: resource.title },
    ],
    locale
  );

  const href =
    resource.kind === "link"
      ? (resource.externalUrl ?? "#")
      : resource.fileMediaId
        ? `/api/media/${resource.fileMediaId}/download`
        : "#";

  const isExternal = resource.kind === "link";

  const ctaLabel =
    resource.kind === "link" ? "Open link ↗" : "Download";

  const kindLabel: Record<string, string> = { pdf: "PDF", doc: "DOC", link: "Link" };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
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
              {dict.nav.resources}
            </p>
            <h1 className="text-3xl font-bold text-white sm:text-4xl">
              {resource.title}
            </h1>
            {resource.description && (
              <p className="mt-4 text-lg text-white/70">{resource.description}</p>
            )}
          </div>
        </Container>
      </section>

      <Container className="py-12 sm:py-16">
        <div className="max-w-3xl">
          {resource.availableLocales.length > 0 && (
            <NotTranslated
              locale={locale}
              dict={dict}
              availableLocales={resource.availableLocales}
              path={`/resources/${slug}`}
            />
          )}

          <div className="flex flex-wrap items-center gap-4">
            <span
              className="rounded-full px-3 py-1 text-sm font-medium"
              style={{ backgroundColor: "#f5f5f5", color: "#6b7280" }}
            >
              {kindLabel[resource.kind] ?? resource.kind.toUpperCase()}
            </span>

            {href !== "#" && (
              <a
                href={href}
                target={isExternal ? "_blank" : undefined}
                rel={isExternal ? "noopener noreferrer" : undefined}
                download={!isExternal ? true : undefined}
                className="inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
                style={{ backgroundColor: "var(--color-brand-deep)" }}
              >
                {ctaLabel}
              </a>
            )}
          </div>
        </div>
      </Container>
    </>
  );
}
