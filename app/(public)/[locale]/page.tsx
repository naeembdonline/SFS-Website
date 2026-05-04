import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import type { Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dict";
import { getSiteSettings } from "@/lib/data/public/settings";
import { getPostList } from "@/lib/data/public/posts";
import { getCampaignList } from "@/lib/data/public/campaigns";
import { getLeadershipMembers } from "@/lib/data/public/leadership";
import { buildMetadata } from "@/lib/seo/metadata";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { PostCard } from "@/components/public/post-card";
import { CampaignCard } from "@/components/public/campaign-card";
import { LeadershipCard } from "@/components/public/leadership-card";
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

  return buildMetadata({
    locale,
    path: "",
    title: settings?.siteName ?? "Sovereignty",
    description: settings?.tagline ?? undefined,
    siteName: settings?.siteName ?? "Sovereignty",
  });
}

export default function HomePage({ params }: HomePageProps) {
  return (
    <Suspense fallback={null}>
      <HomeContent params={params} />
    </Suspense>
  );
}

// Locale-aware static copy (used as fallback until settings DB is seeded)
const HERO_COPY: Record<Locale, { badge: string; tagline: string; ctaJoin: string; ctaAbout: string }> = {
  bn: {
    badge: "ভবিষ্যৎ গড়ার আন্দোলন",
    tagline:
      "একটি সমৃদ্ধ ও সার্বভৌম ভবিষ্যতের অভিযাত্রায় আমরা ঐক্যবদ্ধ। ন্যায়বিচার, সাম্য এবং আত্মমর্যাদার ভিত্তিতে নতুন এক বাংলাদেশ গড়ার প্রত্যয়।",
    ctaJoin: "প্রচারাভিযান",
    ctaAbout: "আমাদের সম্পর্কে",
  },
  en: {
    badge: "Building the Future",
    tagline:
      "We are united in the journey toward a prosperous and sovereign future. Committed to building a new Bangladesh on the foundations of justice, equality, and dignity.",
    ctaJoin: "Campaigns",
    ctaAbout: "About Us",
  },
  ar: {
    badge: "بناء المستقبل",
    tagline:
      "نحن متحدون في رحلة نحو مستقبل مزدهر وسيادي. ملتزمون ببناء بنغلاديش جديدة على أسس العدالة والمساواة والكرامة.",
    ctaJoin: "الحملات",
    ctaAbout: "من نحن",
  },
};

const MISSION_COPY: Record<Locale, { label: string; heading: string; p1: string; p2: string; cta: string }> = {
  bn: {
    label: "আমাদের লক্ষ্য",
    heading: "সার্বভৌমত্ব এবং জনগণের অধিকার রক্ষায় আমরা অবিচল",
    p1: "আমরা বিশ্বাস করি যে প্রতিটি নাগরিকের মর্যাদা এবং অধিকার একটি শক্তিশালী রাষ্ট্রের ভিত্তি। আমাদের সংগঠন এই লক্ষ্য অর্জনে কাজ করে যাচ্ছে যেখানে প্রতিটি কণ্ঠস্বর গুরুত্বপূর্ণ।",
    p2: "রাজনীতি ও সমাজনীতিতে ইতিবাচক পরিবর্তনের মাধ্যমে আমরা একটি উন্নত ও আধুনিক রাষ্ট্রব্যবস্থা গড়ে তুলতে প্রতিশ্রুতিবদ্ধ।",
    cta: "আমাদের নেতৃত্ব সম্পর্কে জানুন",
  },
  en: {
    label: "Our Mission",
    heading: "Unwavering in defending sovereignty and the rights of the people",
    p1: "We believe that the dignity and rights of every citizen are the foundation of a strong state. Our organization works tirelessly toward this goal — a nation where every voice matters.",
    p2: "Through positive change in politics and social policy, we are committed to building an advanced and modern state based on justice and the rule of law.",
    cta: "Learn about our leadership",
  },
  ar: {
    label: "مهمتنا",
    heading: "ثابتون في الدفاع عن السيادة وحقوق الشعب",
    p1: "نؤمن بأن كرامة وحقوق كل مواطن هي أساس الدولة القوية. تعمل منظمتنا دون كلل نحو هذا الهدف — أمة يهم فيها كل صوت.",
    p2: "من خلال التغيير الإيجابي في السياسة والسياسة الاجتماعية، نحن ملتزمون ببناء دولة متقدمة وحديثة قائمة على العدالة وسيادة القانون.",
    cta: "تعرف على قيادتنا",
  },
};

const CTA_COPY: Record<Locale, { heading: string; body: string; btn: string }> = {
  bn: {
    heading: "আমাদের সাথে যোগ দিন",
    body: "একটি শক্তিশালী ও সমৃদ্ধ দেশ গঠনে আপনার অংশগ্রহণ জরুরি। আজই আমাদের সাথে যুক্ত হয়ে পরিবর্তনের অংশ হোন।",
    btn: "যোগাযোগ করুন",
  },
  en: {
    heading: "Join Our Movement",
    body: "Your participation is essential in building a strong and prosperous country. Join us today and be part of the change.",
    btn: "Get in Touch",
  },
  ar: {
    heading: "انضم إلى حركتنا",
    body: "مشاركتك ضرورية في بناء دولة قوية ومزدهرة. انضم إلينا اليوم وكن جزءاً من التغيير.",
    btn: "تواصل معنا",
  },
};

const SECTION_LABELS: Record<Locale, { campaignsDesc: string; newsDesc: string; viewAll: string; allNews: string; leadershipDesc: string; leaders: string }> = {
  bn: {
    campaignsDesc: "চলমান বিভিন্ন কর্মসূচি এবং আমাদের লক্ষ্যসমূহ",
    newsDesc: "সাম্প্রতিক আপডেট এবং আমাদের কার্যক্রমের খবরাখবর",
    viewAll: "সবগুলো দেখুন",
    allNews: "সকল সংবাদ",
    leadershipDesc: "আমাদের অভিজ্ঞ ও নিবেদিতপ্রাণ নেতৃবৃন্দ",
    leaders: "সকল নেতৃবৃন্দ",
  },
  en: {
    campaignsDesc: "Our ongoing programs and the goals we are working toward",
    newsDesc: "Latest updates and news about our activities",
    viewAll: "View All",
    allNews: "All News",
    leadershipDesc: "Our experienced and dedicated leadership",
    leaders: "All Leaders",
  },
  ar: {
    campaignsDesc: "برامجنا الجارية والأهداف التي نعمل نحوها",
    newsDesc: "آخر التحديثات والأخبار حول أنشطتنا",
    viewAll: "عرض الكل",
    allNews: "كل الأخبار",
    leadershipDesc: "قيادتنا ذات الخبرة والتفاني",
    leaders: "جميع القادة",
  },
};

async function HomeContent({ params }: HomePageProps) {
  const { locale } = await params;
  const dict = await getDictionary(locale);
  const [settings, recentNews, activeCampaigns, leaders] = await Promise.all([
    getSiteSettings(locale),
    getPostList("news", locale, 3),
    getCampaignList(locale, 3),
    getLeadershipMembers(locale),
  ]);

  const orgLd = organizationJsonLd({
    siteName: settings?.siteName ?? "Sovereignty",
    contactEmail: settings?.contactEmail ?? null,
  });
  const siteLd = websiteJsonLd({
    siteName: settings?.siteName ?? "Sovereignty",
    locale,
  });

  const hero = HERO_COPY[locale];
  const mission = MISSION_COPY[locale];
  const cta = CTA_COPY[locale];
  const labels = SECTION_LABELS[locale];
  const topLeaders = leaders.slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([orgLd, siteLd]) }}
      />

      {/* ── 1. Hero ──────────────────────────────────────────────────── */}
      <section
        className="relative flex min-h-[90vh] items-center overflow-hidden py-24 sm:py-32"
        style={{ backgroundColor: "var(--color-brand-black)" }}
      >
        {/* Radial glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(11,61,46,0.55) 0%, transparent 70%)",
          }}
        />
        {/* Gold orb */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-32 top-0 h-[500px] w-[500px] rounded-full opacity-10 blur-[120px]"
          style={{ backgroundColor: "var(--color-accent-gold)" }}
        />

        <Container className="relative z-10">
          <div className="max-w-4xl">
            {/* Badge */}
            <div
              className="mb-8 inline-flex items-center gap-3 rounded-full px-4 py-1.5"
              style={{
                border: "1px solid rgba(255,255,255,0.12)",
                background: "rgba(255,255,255,0.05)",
                backdropFilter: "blur(8px)",
              }}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{
                  backgroundColor: "var(--color-accent-gold)",
                  boxShadow: "0 0 8px var(--color-accent-gold)",
                }}
              />
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/75">
                {settings?.tagline ?? hero.badge}
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-6xl font-extrabold leading-[1.1] text-white sm:text-7xl lg:text-[5.5rem]">
              {settings?.siteName ?? "Sovereignty"}
            </h1>

            {/* Sub-copy */}
            <p className="mt-7 max-w-2xl text-lg leading-relaxed text-white/60 sm:text-xl">
              {hero.tagline}
            </p>

            {/* CTAs */}
            <div className="mt-12 flex flex-wrap gap-4">
              <Link
                href={`/${locale}/campaigns`}
                className="group relative inline-flex items-center justify-center overflow-hidden rounded-xl px-8 py-4 text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  backgroundColor: "var(--color-accent-gold)",
                  color: "var(--color-brand-black)",
                }}
              >
                <span className="relative z-10">{dict.nav.campaigns}</span>
                <div
                  className="absolute inset-0 -translate-x-full transition-transform duration-500 group-hover:translate-x-0"
                  style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
                />
              </Link>
              <Link
                href={`/${locale}/about`}
                className="inline-flex items-center justify-center rounded-xl px-8 py-4 text-sm font-bold text-white transition-all"
                style={{
                  border: "1px solid rgba(255,255,255,0.2)",
                  background: "rgba(255,255,255,0.06)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {dict.nav.about}
              </Link>
            </div>

            {/* Stats strip */}
            <div className="mt-16 flex flex-wrap gap-10">
              {[
                { value: "৫০,০০০+", label: locale === "en" ? "Members" : locale === "ar" ? "عضو" : "সদস্য" },
                { value: "৬৪", label: locale === "en" ? "Districts" : locale === "ar" ? "مقاطعة" : "জেলা" },
                { value: "২০+", label: locale === "en" ? "Campaigns" : locale === "ar" ? "حملة" : "প্রচারণা" },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="text-3xl font-extrabold text-white">{stat.value}</div>
                  <div className="mt-1 text-sm text-white/50">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </Container>
      </section>

      {/* ── 2. Mission ───────────────────────────────────────────────── */}
      <section className="bg-white py-24 sm:py-32">
        <Container>
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <div>
              <p
                className="mb-4 text-sm font-bold uppercase tracking-widest"
                style={{ color: "var(--color-accent-gold)" }}
              >
                {mission.label}
              </p>
              <h2
                className="text-4xl font-bold leading-tight sm:text-5xl"
                style={{ color: "var(--color-brand-black)" }}
              >
                {mission.heading}
              </h2>
            </div>
            <div className="space-y-5 text-lg leading-relaxed text-neutral-600">
              <p>{mission.p1}</p>
              <p>{mission.p2}</p>
              <Link
                href={`/${locale}/leadership`}
                className="inline-flex items-center gap-2 font-bold hover:underline"
                style={{ color: "var(--color-brand-deep)" }}
              >
                {mission.cta} <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </Container>
      </section>

      {/* ── 3. Active Campaigns ──────────────────────────────────────── */}
      {activeCampaigns.length > 0 && (
        <section className="py-24 sm:py-32" style={{ backgroundColor: "#f9fafb" }}>
          <Container>
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={dict.nav.campaigns}
                description={labels.campaignsDesc}
                className="max-w-xl"
              />
              <Link
                href={`/${locale}/campaigns`}
                className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#fff" }}
              >
                {labels.viewAll}
              </Link>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {activeCampaigns.map((c) => (
                <CampaignCard key={c.id} campaign={c} locale={locale} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 4. News ──────────────────────────────────────────────────── */}
      {recentNews.length > 0 && (
        <section className="bg-white py-24 sm:py-32">
          <Container>
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={dict.nav.news}
                description={labels.newsDesc}
                className="max-w-xl"
              />
              <Link
                href={`/${locale}/news`}
                className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#fff" }}
              >
                {labels.allNews}
              </Link>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {recentNews.map((p) => (
                <PostCard key={p.id} post={p} type="news" locale={locale} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 5. Leadership preview ────────────────────────────────────── */}
      {topLeaders.length > 0 && (
        <section className="py-24 sm:py-32" style={{ backgroundColor: "#f9fafb" }}>
          <Container>
            <div className="mb-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
              <SectionHeader
                title={dict.nav.leadership}
                description={labels.leadershipDesc}
                className="max-w-xl"
              />
              <Link
                href={`/${locale}/leadership`}
                className="inline-flex h-11 items-center justify-center rounded-lg border px-6 text-sm font-bold text-neutral-900 transition-colors hover:bg-neutral-50"
                style={{ borderColor: "#e5e7eb", backgroundColor: "#fff" }}
              >
                {labels.leaders}
              </Link>
            </div>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {topLeaders.map((m) => (
                <LeadershipCard key={m.id} member={m} />
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* ── 6. CTA banner ────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden py-24 sm:py-32"
        style={{ backgroundColor: "var(--color-brand-deep)" }}
      >
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 opacity-[0.08]">
          <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-white blur-3xl" />
          <div
            className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: "var(--color-accent-gold)" }}
          />
        </div>
        <Container className="relative text-center">
          <h2 className="text-4xl font-bold text-white sm:text-5xl">{cta.heading}</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-white/70">{cta.body}</p>
          <div className="mt-10">
            <Link
              href={`/${locale}/contact`}
              className="inline-flex rounded-xl px-10 py-4 text-sm font-bold shadow-lg shadow-black/20 transition-all hover:scale-105"
              style={{
                backgroundColor: "var(--color-accent-gold)",
                color: "var(--color-brand-black)",
              }}
            >
              {cta.btn}
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
