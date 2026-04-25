import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getSiteSettings } from "@/lib/data/public/settings";
import { getPostList } from "@/lib/data/public/posts";
import { getCampaignList } from "@/lib/data/public/campaigns";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { PostCard } from "@/components/public/post-card";
import { CampaignCard } from "@/components/public/campaign-card";
import { Container } from "@/components/ui/container";
import { SectionHeader } from "@/components/public/section-header";

interface HomePageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: HomePageProps): Promise<Metadata> {
  const { locale } = await params;
  const settings = await getSiteSettings(locale);
  const dict = await getDictionary(locale);

  return buildMetadata({
    locale,
    path: "",
    title: settings?.siteName ?? dict.error.generic,
    description: settings?.tagline ?? undefined,
    siteName: settings?.siteName,
  });
}

export default function HomePage({ params }: HomePageProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent params={params} />
    </Suspense>
  );
}

async function HomeContent({ params }: HomePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const [settings, recentNews, activeCampaigns] = await Promise.all([
    getSiteSettings(locale),
    getPostList("news", locale, 3),
    getCampaignList(locale, 3),
  ]);

  const orgLd = organizationJsonLd({
    siteName: settings?.siteName ?? "Sovereignty",
    contactEmail: settings?.contactEmail ?? null,
  });
  const siteLd = websiteJsonLd({
    siteName: settings?.siteName ?? "Sovereignty",
    locale,
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgLd, siteLd]) }}
      />

      {/* ── 1. Hero Section ───────────────────────────────────────── */}
      <section className="relative flex min-h-[85vh] items-center overflow-hidden bg-[--color-brand-black] py-24 sm:py-32">
        {/* Cinematic Background Effects */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(11,61,46,0.4)_0%,transparent_70%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[--color-brand-deep] opacity-20 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'url("/noise.png")' }}
        />
        
        <Container className="relative">
          <div className="max-w-4xl">
            <div className="mb-6 inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 backdrop-blur-md">
              <span className="h-2 w-2 rounded-full bg-[--color-accent-gold] shadow-[0_0_8px_var(--color-accent-gold)]" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">
                {settings?.tagline ?? "Building the Future"}
              </span>
            </div>
            
            <h1 className="text-5xl font-extrabold leading-[1.15] text-white sm:text-7xl lg:text-8xl">
              {settings?.siteName ?? "Sovereignty"}
            </h1>
            
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
              একটি সমৃদ্ধ ও সার্বভৌম ভবিষ্যতের অভিযাত্রায় আমরা ঐক্যবদ্ধ। ন্যায়বিচার, সাম্য এবং আত্মমর্যাদার ভিত্তিতে নতুন এক বাংলাদেশ গড়ার প্রত্যয়।
            </p>
            
            <div className="mt-12 flex flex-wrap gap-5">
              <Link
                href={`/${locale}/campaigns`}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl bg-[--color-accent-gold] px-8 py-4 text-sm font-bold text-[--color-brand-black] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span className="relative z-10">{dict.nav.campaigns}</span>
                <div className="absolute inset-0 -translate-x-full bg-white/20 transition-transform duration-500 group-hover:translate-x-0" />
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center justify-center rounded-xl border border-white/20 bg-white/5 px-8 py-4 text-sm font-bold text-white backdrop-blur-sm transition-all hover:bg-white/10"
              >
                {dict.nav.about}
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Mission Intro ──────────────────────────────────────── */}
      <section className="bg-white py-24 sm:py-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-[--color-accent-gold]">
                আমাদের লক্ষ্য
              </p>
              <h2 className="text-4xl font-bold leading-tight text-[--color-brand-black] sm:text-5xl">
                সার্বভৌমত্ব এবং জনগণের অধিকার রক্ষায় আমরা অবিচল
              </h2>
            </div>
            <div className="space-y-6 text-lg leading-relaxed text-neutral-600">
              <p>
                আমরা বিশ্বাস করি যে প্রতিটি নাগরিকের মর্যাদা এবং অধিকার একটি শক্তিশালী রাষ্ট্রের ভিত্তি। আমাদের সংগঠন এই লক্ষ্য অর্জনে কাজ করে যাচ্ছে যেখানে প্রতিটি কণ্ঠস্বর গুরুত্বপূর্ণ।
              </p>
              <p>
                রাজনীতি ও সমাজনীতিতে ইতিবাচক পরিবর্তনের মাধ্যমে আমরা একটি উন্নত ও আধুনিক রাষ্ট্রব্যবস্থা গড়ে তুলতে প্রতিশ্রুতিবদ্ধ।
              </p>
              <Link
                href={`/${locale}/leadership`}
                className="inline-flex items-center gap-2 font-bold text-[--color-brand-deep] hover:underline"
              >
                আমাদের নেতৃত্ব সম্পর্কে জানুন <span>→</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. Active Campaigns (Subtle Tinted) ───────────────────── */}
      {activeCampaigns.length > 0 && (
        <section className="bg-neutral-50 py-24 sm:py-32">
          <Container>
            <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader 
                title={dict.nav.campaigns} 
                description="চলমান বিভিন্ন কর্মসূচি এবং আমাদের লক্ষ্যসমূহ"
                className="max-w-xl"
              />
              <Link
                href={`/${locale}/campaigns`}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                সবগুলো দেখুন
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} locale={locale} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 4. News Section (White) ───────────────────────────────── */}
      {recentNews.length > 0 && (
        <section className="bg-white py-24 sm:py-32">
          <Container>
            <div className="mb-16 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader 
                title={dict.nav.news} 
                description="সাম্প্রতিক আপডেট এবং আমাদের কার্যক্রমের খবরাখবর"
                className="max-w-xl"
              />
              <Link
                href={`/${locale}/news`}
                className="inline-flex h-12 items-center justify-center rounded-lg border border-neutral-200 bg-white px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50"
              >
                সকল সংবাদ
              </Link>
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {recentNews.map((p) => (
                <PostCard key={p.id} post={p} type="news" locale={locale} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 5. Call to Action ─────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-[--color-brand-deep] py-24 sm:py-32">
        <div aria-hidden="true" className="absolute inset-0 opacity-10">
           <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-white blur-3xl" />
           <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-[--color-accent-gold] blur-3xl" />
        </div>
        <Container className="relative text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">
            আমাদের সাথে যোগ দিন
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/70">
            একটি শক্তিশালী ও সমৃদ্ধ দেশ গঠনে আপনার অংশগ্রহণ জরুরি। আজই আমাদের সাথে যুক্ত হয়ে পরিবর্তনের অংশ হোন।
          </p>
          <div className="mt-10">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex rounded-xl bg-[--color-accent-gold] px-10 py-4 text-sm font-bold text-[--color-brand-black] shadow-lg shadow-black/20 transition-all hover:scale-105"
            >
              যোগাযোগ করুন
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
