/**
 * Demo / fallback content — used when the database is empty or unavailable.
 * Provides realistic Bangladeshi political movement content for development.
 * Real data from the admin panel always takes precedence.
 */

import type { Locale } from "@/lib/i18n/config";
import type { SiteSettingsPublic } from "./public/settings";
import type { LeadershipMember } from "./public/leadership";
import type { PostListItem, PostDetail } from "./public/posts";
import type { CampaignListItem, CampaignDetail } from "./public/campaigns";
import type { PageContent } from "./public/pages";
import type { ResourceListItem } from "./public/resources";

// ─── Settings ─────────────────────────────────────────────────────────────────

export const DEMO_SETTINGS: Record<Locale, SiteSettingsPublic> = {
  bn: {
    siteName: "সার্বভৌমত্ব",
    tagline: "ন্যায়বিচার, সাম্য ও আত্মমর্যাদার বাংলাদেশ গড়ার প্রত্যয়",
    footerText: "একটি শক্তিশালী ও সমৃদ্ধ বাংলাদেশ গড়ার আন্দোলন",
    contactEmail: "info@sovereignty.org.bd",
    contactPhone: "+880 2-9888-1234",
    address: "৪৫, মতিঝিল বাণিজ্যিক এলাকা, ঢাকা-১০০০",
    socials: [
      { platform: "Facebook", url: "https://facebook.com/sovereignty.bd" },
      { platform: "Twitter", url: "https://twitter.com/sovereignty_bd" },
      { platform: "YouTube", url: "https://youtube.com/@sovereigntybd" },
    ],
  },
  en: {
    siteName: "Sovereignty",
    tagline: "Building a Just, Equal and Dignified Bangladesh",
    footerText: "A movement for a strong and prosperous Bangladesh",
    contactEmail: "info@sovereignty.org.bd",
    contactPhone: "+880 2-9888-1234",
    address: "45, Motijheel Commercial Area, Dhaka-1000",
    socials: [
      { platform: "Facebook", url: "https://facebook.com/sovereignty.bd" },
      { platform: "Twitter", url: "https://twitter.com/sovereignty_bd" },
      { platform: "YouTube", url: "https://youtube.com/@sovereigntybd" },
    ],
  },
  ar: {
    siteName: "السيادة",
    tagline: "من أجل بنغلاديش عادلة ومتساوية وكريمة",
    footerText: "حركة من أجل بنغلاديش قوية ومزدهرة",
    contactEmail: "info@sovereignty.org.bd",
    contactPhone: "+880 2-9888-1234",
    address: "45، منطقة موتيجهيل التجارية، دكا-1000",
    socials: [
      { platform: "Facebook", url: "https://facebook.com/sovereignty.bd" },
    ],
  },
};

// ─── Leadership ───────────────────────────────────────────────────────────────

export const DEMO_LEADERSHIP: Record<Locale, LeadershipMember[]> = {
  bn: [
    {
      id: 1,
      name: "মোহাম্মদ রফিকুল ইসলাম",
      roleTitle: "সভাপতি",
      bio: "প্রায় ৩০ বছরের রাজনৈতিক অভিজ্ঞতাসম্পন্ন রফিকুল ইসলাম দেশের একজন প্রখ্যাত রাজনৈতিক ব্যক্তিত্ব। তিনি দুর্নীতিবিরোধী আন্দোলনে সক্রিয়ভাবে অংশগ্রহণ করেছেন এবং গণতান্ত্রিক সংস্কারের জন্য নিরলস কাজ করে আসছেন।",
      photoMediaId: null,
      displayOrder: 1,
    },
    {
      id: 2,
      name: "ড. শাহিদা আখতার",
      roleTitle: "মহাসচিব",
      bio: "ঢাকা বিশ্ববিদ্যালয়ের রাষ্ট্রবিজ্ঞান বিভাগের অধ্যাপক ড. শাহিদা আখতার একজন বিশিষ্ট শিক্ষাবিদ ও রাজনৈতিক বিশ্লেষক। তিনি নারী অধিকার ও শিক্ষা সংস্কারের জন্য বিশেষভাবে পরিচিত।",
      photoMediaId: null,
      displayOrder: 2,
    },
    {
      id: 3,
      name: "আহমেদ কামাল",
      roleTitle: "কোষাধ্যক্ষ",
      bio: "সফল উদ্যোক্তা ও সমাজসেবী আহমেদ কামাল দেশের অর্থনৈতিক উন্নয়নে গুরুত্বপূর্ণ ভূমিকা রাখছেন। তিনি তরুণ উদ্যোক্তাদের সহায়তায় বিভিন্ন কর্মসূচি পরিচালনা করেন।",
      photoMediaId: null,
      displayOrder: 3,
    },
    {
      id: 4,
      name: "ফাতেমা বেগম",
      roleTitle: "মহিলা সম্পাদক",
      bio: "মানবাধিকার কর্মী ও সমাজসেবী ফাতেমা বেগম নারীর ক্ষমতায়ন ও সামাজিক ন্যায়বিচারের জন্য দীর্ঘদিন ধরে কাজ করে আসছেন। তিনি বিভিন্ন জাতীয় ও আন্তর্জাতিক সংস্থার সাথে যুক্ত।",
      photoMediaId: null,
      displayOrder: 4,
    },
    {
      id: 5,
      name: "ইঞ্জিনিয়ার রাশেদ হাসান",
      roleTitle: "যুব সম্পাদক",
      bio: "প্রযুক্তি খাতের বিশিষ্ট উদ্যোক্তা রাশেদ হাসান দেশের তরুণ প্রজন্মের কণ্ঠস্বর। তিনি ডিজিটাল বাংলাদেশ গড়ার স্বপ্ন নিয়ে রাজনীতিতে এসেছেন।",
      photoMediaId: null,
      displayOrder: 5,
    },
    {
      id: 6,
      name: "নুরুল আমিন চৌধুরী",
      roleTitle: "সাংগঠনিক সম্পাদক",
      bio: "তৃণমূল পর্যায়ের রাজনীতিতে দীর্ঘ অভিজ্ঞতাসম্পন্ন নুরুল আমিন সারা দেশে দলের সাংগঠনিক কার্যক্রম পরিচালনা করেন। তাঁর নেতৃত্বে ৬৪টি জেলায় দলের কমিটি গঠিত হয়েছে।",
      photoMediaId: null,
      displayOrder: 6,
    },
  ],
  en: [
    {
      id: 1,
      name: "Mohammed Rafiqul Islam",
      roleTitle: "President",
      bio: "With nearly 30 years of political experience, Rafiqul Islam is a prominent political figure. He has actively participated in anti-corruption movements and has been working tirelessly for democratic reform.",
      photoMediaId: null,
      displayOrder: 1,
    },
    {
      id: 2,
      name: "Dr. Shahida Akhter",
      roleTitle: "Secretary General",
      bio: "Professor of Political Science at Dhaka University, Dr. Shahida Akhter is a distinguished academic and political analyst. She is particularly known for her advocacy on women's rights and education reform.",
      photoMediaId: null,
      displayOrder: 2,
    },
    {
      id: 3,
      name: "Ahmed Kamal",
      roleTitle: "Treasurer",
      bio: "Successful entrepreneur and philanthropist Ahmed Kamal plays an important role in the country's economic development. He runs various programs to support and mentor young entrepreneurs.",
      photoMediaId: null,
      displayOrder: 3,
    },
    {
      id: 4,
      name: "Fatema Begum",
      roleTitle: "Women's Secretary",
      bio: "Human rights activist and social worker Fatema Begum has been working for women's empowerment and social justice for many years. She is associated with various national and international organizations.",
      photoMediaId: null,
      displayOrder: 4,
    },
    {
      id: 5,
      name: "Engineer Rashed Hassan",
      roleTitle: "Youth Secretary",
      bio: "A prominent tech entrepreneur, Rashed Hassan is the voice of the younger generation. He entered politics with a vision to build a digital Bangladesh.",
      photoMediaId: null,
      displayOrder: 5,
    },
    {
      id: 6,
      name: "Nurul Amin Chowdhury",
      roleTitle: "Organizing Secretary",
      bio: "With extensive grassroots political experience, Nurul Amin leads the party's organizational activities across the country. Under his leadership, district committees have been formed in all 64 districts.",
      photoMediaId: null,
      displayOrder: 6,
    },
  ],
  ar: [
    {
      id: 1,
      name: "محمد رفيق الإسلام",
      roleTitle: "الرئيس",
      bio: "بخبرة سياسية تمتد لنحو 30 عاماً، يُعدّ رفيق الإسلام شخصية سياسية بارزة. وقد شارك بنشاط في حركات مكافحة الفساد وعمل بلا كلل من أجل الإصلاح الديمقراطي.",
      photoMediaId: null,
      displayOrder: 1,
    },
    {
      id: 2,
      name: "د. شاهيدا أختر",
      roleTitle: "الأمينة العامة",
      bio: "أستاذة العلوم السياسية بجامعة دكا، الدكتورة شاهيدا أختر أكاديمية ومحللة سياسية متميزة. وهي معروفة بشكل خاص بدفاعها عن حقوق المرأة وإصلاح التعليم.",
      photoMediaId: null,
      displayOrder: 2,
    },
  ],
};

// ─── News Posts ───────────────────────────────────────────────────────────────

export const DEMO_NEWS: Record<Locale, PostListItem[]> = {
  bn: [
    {
      id: 1,
      type: "news",
      slug: "barshik-samabeshe-lakshadhik-manusher-dhol",
      title: "সার্বভৌমত্ব আন্দোলনের বার্ষিক সমাবেশে লক্ষাধিক মানুষের ঢল",
      excerpt:
        "ঢাকার সোহরাওয়ার্দী উদ্যানে আয়োজিত বার্ষিক মহাসমাবেশে সারা দেশ থেকে প্রায় ১৫ লক্ষ মানুষ অংশগ্রহণ করেছেন। এটি দলের ইতিহাসে সবচেয়ে বড় সমাবেশ।",
      publishedAt: new Date("2026-04-20"),
      coverMediaId: null,
    },
    {
      id: 2,
      type: "news",
      slug: "shikkha-shangskar-nie-songsad-sadasyader-shathe-baithak",
      title: "শিক্ষা সংস্কার নিয়ে সংসদ সদস্যদের সাথে গুরুত্বপূর্ণ বৈঠক সম্পন্ন",
      excerpt:
        "জাতীয় শিক্ষানীতি সংস্কারের দাবিতে সার্বভৌমত্ব আন্দোলনের নেতৃবৃন্দ বিভিন্ন দলের সংসদ সদস্যদের সাথে এক ফলপ্রসূ বৈঠকে মিলিত হয়েছেন।",
      publishedAt: new Date("2026-04-10"),
      coverMediaId: null,
    },
    {
      id: 3,
      type: "news",
      slug: "tarun-proyogner-rajnitik-sachentanata-briddhite-naya-karmashuchi",
      title: "তরুণ প্রজন্মের রাজনৈতিক সচেতনতা বৃদ্ধিতে নতুন কর্মসূচি ঘোষণা",
      excerpt:
        "সারা দেশের বিশ্ববিদ্যালয় ও কলেজগুলোতে রাজনৈতিক সচেতনতামূলক কার্যক্রম পরিচালনা করতে 'যুব সার্বভৌমত্ব' কর্মসূচি চালু করা হয়েছে।",
      publishedAt: new Date("2026-03-25"),
      coverMediaId: null,
    },
    {
      id: 4,
      type: "news",
      slug: "durnitibirodhi-andolaner-naya-dharapata",
      title: "দুর্নীতিবিরোধী আন্দোলনের নতুন ধাপ শুরু হচ্ছে আগামীকাল",
      excerpt:
        "সরকারি ক্রয়প্রক্রিয়ায় স্বচ্ছতা আনতে এবং দুর্নীতিকারীদের বিচারের আওতায় আনতে নতুন গণআন্দোলন শুরু হতে যাচ্ছে।",
      publishedAt: new Date("2026-03-10"),
      coverMediaId: null,
    },
  ],
  en: [
    {
      id: 1,
      type: "news",
      slug: "sovereignty-annual-rally-millions-attend",
      title: "Millions Attend Sovereignty Movement's Annual Grand Rally",
      excerpt:
        "Nearly 1.5 million people from across the country attended the annual grand rally held at Suhrawardy Udyan in Dhaka. This is the largest rally in the party's history.",
      publishedAt: new Date("2026-04-20"),
      coverMediaId: null,
    },
    {
      id: 2,
      type: "news",
      slug: "education-reform-meeting-with-mps-successful",
      title: "Productive Meeting with MPs on Education Reform Concluded",
      excerpt:
        "Sovereignty Movement leaders met with members of parliament from various parties in a productive meeting demanding national education policy reform.",
      publishedAt: new Date("2026-04-10"),
      coverMediaId: null,
    },
    {
      id: 3,
      type: "news",
      slug: "new-program-to-raise-political-awareness-among-youth",
      title: "New Program Launched to Raise Political Awareness Among Youth",
      excerpt:
        "The 'Youth Sovereignty' program has been launched to conduct political awareness activities at universities and colleges across the country.",
      publishedAt: new Date("2026-03-25"),
      coverMediaId: null,
    },
    {
      id: 4,
      type: "news",
      slug: "new-phase-of-anti-corruption-movement-begins-tomorrow",
      title: "New Phase of Anti-Corruption Movement Begins Tomorrow",
      excerpt:
        "A new mass movement is about to begin to bring transparency to government procurement and to bring the corrupt to justice.",
      publishedAt: new Date("2026-03-10"),
      coverMediaId: null,
    },
  ],
  ar: [
    {
      id: 1,
      type: "news",
      slug: "sovereignty-annual-rally-ar",
      title: "الملايين يحضرون التجمع السنوي الكبير لحركة السيادة",
      excerpt:
        "شارك ما يقارب 1.5 مليون شخص من مختلف أنحاء البلاد في التجمع السنوي الكبير المنعقد في حديقة سهراوردي بداكا.",
      publishedAt: new Date("2026-04-20"),
      coverMediaId: null,
    },
  ],
};

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export const DEMO_BLOG: Record<Locale, PostListItem[]> = {
  bn: [
    {
      id: 10,
      type: "blog",
      slug: "bangladeshe-ganatantrer-bhabishat",
      title: "বাংলাদেশে গণতন্ত্রের ভবিষ্যৎ: একটি বিশ্লেষণ",
      excerpt:
        "বাংলাদেশের রাজনৈতিক পরিস্থিতি বিশ্লেষণ করে ভবিষ্যৎ গণতন্ত্রের রূপরেখা তুলে ধরা হয়েছে এই প্রবন্ধে। সুশীল সমাজ ও জনগণের ভূমিকা নিয়ে গভীর আলোচনা রয়েছে।",
      publishedAt: new Date("2026-04-15"),
      coverMediaId: null,
    },
    {
      id: 11,
      type: "blog",
      slug: "shikkha-khate-biনিয়োগ-badhanor-proyojoniyota",
      title: "শিক্ষাখাতে বিনিয়োগ বাড়ানোর প্রয়োজনীয়তা",
      excerpt:
        "জিডিপির মাত্র ২% শিক্ষায় ব্যয় করে একটি উন্নত রাষ্ট্র গড়া সম্ভব নয়। এই প্রবন্ধে শিক্ষাখাতে বাজেট বৃদ্ধির যুক্তিসংগত প্রস্তাবনা তুলে ধরা হয়েছে।",
      publishedAt: new Date("2026-04-01"),
      coverMediaId: null,
    },
    {
      id: 12,
      type: "blog",
      slug: "nari-kkhamatayon-rajnitir-bhumika",
      title: "নারীর ক্ষমতায়নে রাজনীতির ভূমিকা",
      excerpt:
        "রাজনৈতিক অংশগ্রহণ ও নারীর ক্ষমতায়নের মধ্যে সম্পর্ক বিশ্লেষণ করে বাংলাদেশে নারী নেতৃত্ব বিকাশের পথ নির্দেশনা দেওয়া হয়েছে।",
      publishedAt: new Date("2026-03-20"),
      coverMediaId: null,
    },
  ],
  en: [
    {
      id: 10,
      type: "blog",
      slug: "future-of-democracy-in-bangladesh",
      title: "The Future of Democracy in Bangladesh: An Analysis",
      excerpt:
        "This essay analyzes the political landscape of Bangladesh and outlines the future shape of democracy. It includes an in-depth discussion on the role of civil society and the people.",
      publishedAt: new Date("2026-04-15"),
      coverMediaId: null,
    },
    {
      id: 11,
      type: "blog",
      slug: "need-to-increase-investment-in-education",
      title: "The Need to Increase Investment in Education",
      excerpt:
        "It is not possible to build a developed nation by spending only 2% of GDP on education. This essay presents a rational proposal for increasing the education budget.",
      publishedAt: new Date("2026-04-01"),
      coverMediaId: null,
    },
    {
      id: 12,
      type: "blog",
      slug: "role-of-politics-in-womens-empowerment",
      title: "The Role of Politics in Women's Empowerment",
      excerpt:
        "This piece analyzes the relationship between political participation and women's empowerment, providing guidance on developing women's leadership in Bangladesh.",
      publishedAt: new Date("2026-03-20"),
      coverMediaId: null,
    },
  ],
  ar: [
    {
      id: 10,
      type: "blog",
      slug: "mustaqbal-aldimuqratiyya-fi-bangladish",
      title: "مستقبل الديمقراطية في بنغلاديش: تحليل",
      excerpt:
        "يحلل هذا المقال المشهد السياسي في بنغلاديش ويرسم ملامح الديمقراطية في المستقبل، مع نقاش معمق حول دور المجتمع المدني والشعب.",
      publishedAt: new Date("2026-04-15"),
      coverMediaId: null,
    },
  ],
};

// ─── Campaigns ────────────────────────────────────────────────────────────────

export const DEMO_CAMPAIGNS: Record<Locale, CampaignListItem[]> = {
  bn: [
    {
      id: 1,
      slug: "shikkha-shangskar-andolan",
      title: "শিক্ষা সংস্কার আন্দোলন",
      excerpt:
        "মানসম্মত শিক্ষার জন্য আমাদের আন্দোলন। প্রতিটি শিশুর শিক্ষার অধিকার নিশ্চিত করতে শিক্ষা বাজেট জিডিপির ৫% এ উন্নীত করার দাবি।",
      publishedAt: new Date("2026-01-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2026-01-01",
      endDate: null,
    },
    {
      id: 2,
      slug: "durnitimukt-bangladesh",
      title: "দুর্নীতিমুক্ত বাংলাদেশ",
      excerpt:
        "দুর্নীতির বিরুদ্ধে আমাদের দৃঢ় অবস্থান। সরকারি ক্রয়প্রক্রিয়ায় স্বচ্ছতা আনা এবং দুর্নীতি দমন কমিশনকে স্বাধীন করার দাবিতে আন্দোলন।",
      publishedAt: new Date("2025-06-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2025-06-01",
      endDate: null,
    },
    {
      id: 3,
      slug: "krishak-adhikar-raksha",
      title: "কৃষক অধিকার রক্ষা অভিযান",
      excerpt:
        "কৃষকদের ন্যায্য মূল্য ও সুরক্ষার দাবিতে সফলভাবে পরিচালিত এই অভিযানের ফলে সরকার কৃষি ভর্তুকি ২০% বৃদ্ধি করতে বাধ্য হয়েছে।",
      publishedAt: new Date("2025-01-01"),
      coverMediaId: null,
      statusLifecycle: "past",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    },
  ],
  en: [
    {
      id: 1,
      slug: "education-reform-movement",
      title: "Education Reform Movement",
      excerpt:
        "Our movement for quality education. Demanding that the education budget be raised to 5% of GDP to ensure every child's right to education.",
      publishedAt: new Date("2026-01-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2026-01-01",
      endDate: null,
    },
    {
      id: 2,
      slug: "corruption-free-bangladesh",
      title: "Corruption-Free Bangladesh",
      excerpt:
        "Our firm stance against corruption. A movement demanding transparency in government procurement and making the Anti-Corruption Commission truly independent.",
      publishedAt: new Date("2025-06-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2025-06-01",
      endDate: null,
    },
    {
      id: 3,
      slug: "farmers-rights-protection",
      title: "Farmers' Rights Protection Campaign",
      excerpt:
        "This successfully conducted campaign demanding fair prices and protections for farmers forced the government to increase agricultural subsidies by 20%.",
      publishedAt: new Date("2025-01-01"),
      coverMediaId: null,
      statusLifecycle: "past",
      startDate: "2025-01-01",
      endDate: "2025-12-31",
    },
  ],
  ar: [
    {
      id: 1,
      slug: "harakat-islah-altaalim",
      title: "حركة إصلاح التعليم",
      excerpt:
        "حركتنا من أجل التعليم الجيد. نطالب برفع ميزانية التعليم إلى 5% من الناتج المحلي الإجمالي لضمان حق كل طفل في التعليم.",
      publishedAt: new Date("2026-01-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2026-01-01",
      endDate: null,
    },
  ],
};

// ─── Campaign Detail ──────────────────────────────────────────────────────────

export const DEMO_CAMPAIGN_DETAILS: Record<string, Record<Locale, CampaignDetail | null>> = {
  "shikkha-shangskar-andolan": {
    bn: {
      id: 1,
      slug: "shikkha-shangskar-andolan",
      title: "শিক্ষা সংস্কার আন্দোলন",
      excerpt: "মানসম্মত শিক্ষার জন্য আমাদের আন্দোলন।",
      body: `<h2>আমাদের দাবি</h2>
<p>বাংলাদেশে শিক্ষাখাতে আমূল পরিবর্তন আনতে সার্বভৌমত্ব আন্দোলন একটি ব্যাপক শিক্ষা সংস্কার কর্মসূচি গ্রহণ করেছে।</p>
<ul>
<li>শিক্ষা বাজেট জিডিপির ন্যূনতম ৫% নিশ্চিত করতে হবে</li>
<li>প্রাথমিক শিক্ষার মানোন্নয়নে বিশেষ তহবিল গঠন</li>
<li>শিক্ষকদের বেতন ও মর্যাদা বৃদ্ধি</li>
<li>দিজিটাল শিক্ষা অবকাঠামো উন্নয়ন</li>
<li>শিক্ষাখাতে দুর্নীতি দূরীকরণ</li>
</ul>
<h2>আমাদের অগ্রগতি</h2>
<p>এ পর্যন্ত সারা দেশের ১০,০০০ এরও বেশি শিক্ষক ও শিক্ষার্থী এই আন্দোলনে যোগ দিয়েছেন।</p>`,
      goals: "শিক্ষা বাজেট ৫% নিশ্চিত করা, শিক্ষকদের মর্যাদা বৃদ্ধি, ডিজিটাল শিক্ষা অবকাঠামো নির্মাণ",
      publishedAt: new Date("2026-01-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2026-01-01",
      endDate: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
      availableLocales: ["en"],
    },
    en: {
      id: 1,
      slug: "education-reform-movement",
      title: "Education Reform Movement",
      excerpt: "Our movement for quality education.",
      body: `<h2>Our Demands</h2>
<p>The Sovereignty Movement has adopted a comprehensive education reform program to bring fundamental change to Bangladesh's education sector.</p>
<ul>
<li>Ensure a minimum of 5% of GDP for the education budget</li>
<li>Establish a special fund for improving primary education quality</li>
<li>Increase teacher salaries and prestige</li>
<li>Develop digital education infrastructure</li>
<li>Eliminate corruption in the education sector</li>
</ul>
<h2>Our Progress</h2>
<p>So far, more than 10,000 teachers and students from across the country have joined this movement.</p>`,
      goals: "Ensure 5% education budget, increase teacher dignity, build digital education infrastructure",
      publishedAt: new Date("2026-01-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2026-01-01",
      endDate: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
      availableLocales: ["bn"],
    },
    ar: null,
  },
  "corruption-free-bangladesh": {
    bn: null,
    en: {
      id: 2,
      slug: "corruption-free-bangladesh",
      title: "Corruption-Free Bangladesh",
      excerpt: "Our firm stance against corruption.",
      body: `<h2>The Problem</h2>
<p>Corruption costs Bangladesh an estimated $8 billion annually, hampering development and undermining public trust in institutions.</p>
<h2>Our Solution</h2>
<ul>
<li>Independent Anti-Corruption Commission with real enforcement power</li>
<li>Mandatory asset disclosure for all public officials</li>
<li>Transparent public procurement through e-Government platforms</li>
<li>Whistleblower protection legislation</li>
<li>Judicial independence reforms</li>
</ul>`,
      goals: "Independent ACC, transparent procurement, judicial reform",
      publishedAt: new Date("2025-06-01"),
      coverMediaId: null,
      statusLifecycle: "active",
      startDate: "2025-06-01",
      endDate: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
      availableLocales: [],
    },
    ar: null,
  },
};

// ─── Resources ───────────────────────────────────────────────────────────────

export const DEMO_RESOURCES: Record<Locale, ResourceListItem[]> = {
  bn: [
    {
      id: 1,
      kind: "pdf",
      slug: "sarbovoumotto-manifesto-2026",
      title: "সার্বভৌমত্ব আন্দোলনের ইশতেহার ২০২৬",
      description: "আমাদের পাঁচ বছরের কর্মপরিকল্পনা ও দলের মূল নীতিমালা সম্বলিত মূল দলিল।",
      publishedAt: new Date("2026-01-15"),
      fileMediaId: null,
      externalUrl: null,
    },
    {
      id: 2,
      kind: "pdf",
      slug: "shikkha-shangskar-niti-2025",
      title: "শিক্ষা সংস্কার নীতিমালা ২০২৫",
      description: "বাংলাদেশের শিক্ষাব্যবস্থার সমস্যা চিহ্নিতকরণ ও সমাধানের বিস্তারিত রূপরেখা।",
      publishedAt: new Date("2025-09-01"),
      fileMediaId: null,
      externalUrl: null,
    },
    {
      id: 3,
      kind: "link",
      slug: "sarbovoumotto-youtube",
      title: "ইউটিউব চ্যানেল",
      description: "আমাদের সব সভা, সমাবেশ ও বক্তৃতার ভিডিও দেখুন।",
      publishedAt: new Date("2025-06-01"),
      fileMediaId: null,
      externalUrl: "https://youtube.com/@sovereigntybd",
    },
    {
      id: 4,
      kind: "pdf",
      slug: "krishak-odhikar-report-2025",
      title: "কৃষক অধিকার প্রতিবেদন ২০২৫",
      description: "কৃষক অধিকার আন্দোলনের ফলাফল ও কৃষি ভর্তুকি বৃদ্ধির বিস্তারিত প্রতিবেদন।",
      publishedAt: new Date("2025-12-31"),
      fileMediaId: null,
      externalUrl: null,
    },
  ],
  en: [
    {
      id: 1,
      kind: "pdf",
      slug: "sovereignty-manifesto-2026",
      title: "Sovereignty Movement Manifesto 2026",
      description: "The core document containing our five-year action plan and the movement's fundamental principles.",
      publishedAt: new Date("2026-01-15"),
      fileMediaId: null,
      externalUrl: null,
    },
    {
      id: 2,
      kind: "pdf",
      slug: "education-reform-policy-2025",
      title: "Education Reform Policy 2025",
      description: "A detailed framework for identifying problems and solutions in Bangladesh's education system.",
      publishedAt: new Date("2025-09-01"),
      fileMediaId: null,
      externalUrl: null,
    },
    {
      id: 3,
      kind: "link",
      slug: "sovereignty-youtube",
      title: "YouTube Channel",
      description: "Watch videos of all our meetings, rallies, and speeches.",
      publishedAt: new Date("2025-06-01"),
      fileMediaId: null,
      externalUrl: "https://youtube.com/@sovereigntybd",
    },
    {
      id: 4,
      kind: "pdf",
      slug: "farmers-rights-report-2025",
      title: "Farmers' Rights Report 2025",
      description: "A detailed report on the outcomes of the Farmers' Rights Campaign and the increase in agricultural subsidies.",
      publishedAt: new Date("2025-12-31"),
      fileMediaId: null,
      externalUrl: null,
    },
  ],
  ar: [
    {
      id: 1,
      kind: "pdf",
      slug: "sovereignty-manifesto-2026-ar",
      title: "بيان حركة السيادة 2026",
      description: "الوثيقة الأساسية التي تحتوي على خطة عمل خمسية ومبادئ الحركة الأساسية.",
      publishedAt: new Date("2026-01-15"),
      fileMediaId: null,
      externalUrl: null,
    },
  ],
};

// ─── Pages ────────────────────────────────────────────────────────────────────

export const DEMO_PAGES: Record<string, Record<Locale, PageContent | null>> = {
  about: {
    bn: {
      id: 1,
      key: "about",
      title: "আমাদের সম্পর্কে",
      body: `<h2>সার্বভৌমত্ব আন্দোলন</h2>
<p>সার্বভৌমত্ব হলো একটি গণতান্ত্রিক রাজনৈতিক আন্দোলন যা বাংলাদেশের মানুষের অধিকার, মর্যাদা ও স্বাধীনতার জন্য প্রতিশ্রুতিবদ্ধ। আমরা বিশ্বাস করি প্রতিটি নাগরিকের সমান সুযোগ পাওয়ার অধিকার আছে।</p>

<h2>আমাদের মিশন</h2>
<p>একটি দুর্নীতিমুক্ত, গণতান্ত্রিক ও ন্যায়বিচারভিত্তিক বাংলাদেশ গড়ে তোলা যেখানে প্রতিটি কণ্ঠস্বর গুরুত্বপূর্ণ। আমরা রাজনীতিকে জনগণের সেবায় ফিরিয়ে আনতে চাই।</p>

<h2>আমাদের মূল্যবোধ</h2>
<p><strong>ন্যায়বিচার:</strong> প্রতিটি নাগরিকের জন্য সমান বিচার ও সুযোগ নিশ্চিত করা।</p>
<p><strong>সততা:</strong> দুর্নীতিমুক্ত ও স্বচ্ছ রাজনীতির চর্চা। প্রতিটি পদক্ষেপে জনগণের কাছে জবাবদিহিতা।</p>
<p><strong>সেবা:</strong> জনগণের সেবায় নিবেদিত নেতৃত্ব। নিজের স্বার্থের উপরে জনস্বার্থকে প্রাধান্য দেওয়া।</p>
<p><strong>ঐক্য:</strong> বিভেদের পরিবর্তে ঐক্যের রাজনীতি। সকল ধর্ম, বর্ণ ও শ্রেণীর মানুষকে একত্রিত করা।</p>
<p><strong>সার্বভৌমত্ব:</strong> জাতীয় স্বার্থ ও সার্বভৌমত্ব রক্ষায় অবিচল অঙ্গীকার।</p>

<h2>ইতিহাস</h2>
<p>২০১৯ সালে প্রতিষ্ঠিত সার্বভৌমত্ব আন্দোলন তরুণ প্রজন্মের আশা-আকাঙ্ক্ষাকে কেন্দ্র করে গড়ে উঠেছে। প্রতিষ্ঠার মাত্র কয়েক বছরের মধ্যে সারা দেশে আমাদের ৫০,০০০ এরও বেশি সক্রিয় সদস্য যোগ দিয়েছেন।</p>
<p>আমাদের আন্দোলন কোনো ব্যক্তি বা পরিবারের নয় — এটি জনগণের। তৃণমূল থেকে শুরু করে জাতীয় পর্যায় পর্যন্ত প্রতিটি সিদ্ধান্ত গণতান্ত্রিক প্রক্রিয়ায় নেওয়া হয়।</p>

<h2>আমাদের অর্জন</h2>
<ul>
<li>কৃষক অধিকার আন্দোলনের মাধ্যমে কৃষি ভর্তুকি ২০% বৃদ্ধি</li>
<li>শিক্ষা সংস্কার আন্দোলনে ১০,০০০+ শিক্ষক ও শিক্ষার্থীর সম্পৃক্ততা</li>
<li>সারা দেশে ৬৪ জেলায় সক্রিয় কমিটি</li>
<li>২০+ জাতীয় ও আন্তর্জাতিক পুরস্কার</li>
</ul>`,
      sections: null,
      seoTitle: "আমাদের সম্পর্কে — সার্বভৌমত্ব",
      metaDescription: "সার্বভৌমত্ব আন্দোলনের মিশন, মূল্যবোধ ও ইতিহাস সম্পর্কে জানুন।",
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    en: {
      id: 1,
      key: "about",
      title: "About Us",
      body: `<h2>The Sovereignty Movement</h2>
<p>Sovereignty is a democratic political movement committed to the rights, dignity, and freedom of the people of Bangladesh. We believe every citizen deserves equal opportunity and a voice in shaping their country's future.</p>

<h2>Our Mission</h2>
<p>To build a corruption-free, democratic, and justice-based Bangladesh where every voice matters. We want to return politics to the service of the people — not the other way around.</p>

<h2>Our Values</h2>
<p><strong>Justice:</strong> Ensuring equal justice and opportunity for every citizen, regardless of religion, ethnicity, or background.</p>
<p><strong>Integrity:</strong> Practicing corruption-free and transparent politics. Accountability to the public in every step we take.</p>
<p><strong>Service:</strong> Leadership dedicated to serving the people. Prioritizing public interest over personal gain.</p>
<p><strong>Unity:</strong> Politics of unity rather than division. Bringing together people of all faiths, backgrounds, and classes.</p>
<p><strong>Sovereignty:</strong> An unwavering commitment to protecting the national interest and sovereignty of Bangladesh.</p>

<h2>Our History</h2>
<p>Founded in 2019, the Sovereignty movement was built around the hopes and aspirations of a new generation. Within just a few years of its founding, more than 50,000 active members from across the country have joined our cause.</p>
<p>Our movement belongs not to any individual or family — it belongs to the people. Every decision, from the grassroots to the national level, is made through a democratic process.</p>

<h2>Our Achievements</h2>
<ul>
<li>A 20% increase in agricultural subsidies through the Farmers' Rights campaign</li>
<li>Over 10,000 teachers and students engaged in the Education Reform movement</li>
<li>Active committees in all 64 districts across the country</li>
<li>20+ national and international awards and recognitions</li>
</ul>`,
      sections: null,
      seoTitle: "About Us — Sovereignty",
      metaDescription: "Learn about the mission, values, and history of the Sovereignty Movement.",
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    ar: {
      id: 1,
      key: "about",
      title: "من نحن",
      body: `<h2>حركة السيادة</h2>
<p>السيادة هي حركة سياسية ديمقراطية ملتزمة بحقوق وكرامة وحرية شعب بنغلاديش. نؤمن بأن كل مواطن يستحق تكافؤ الفرص وصوتاً في تشكيل مستقبل بلده.</p>
<h2>مهمتنا</h2>
<p>بناء بنغلاديش خالية من الفساد، ديمقراطية وقائمة على العدالة، حيث يهم كل صوت.</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
  },
  contact: {
    bn: {
      id: 2,
      key: "contact",
      title: "যোগাযোগ",
      body: `<p>আমাদের সাথে যোগাযোগ করুন। আপনার মতামত, প্রশ্ন বা পরামর্শ আমাদের কাছে অত্যন্ত গুরুত্বপূর্ণ।</p>
<p>আমাদের দলের একজন প্রতিনিধি সাধারণত ২৪ ঘণ্টার মধ্যে আপনার সাথে যোগাযোগ করবেন।</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    en: {
      id: 2,
      key: "contact",
      title: "Contact Us",
      body: `<p>Get in touch with us. Your opinions, questions, and suggestions are very important to us.</p>
<p>A member of our team will typically contact you within 24 hours.</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    ar: null,
  },
  privacy: {
    bn: {
      id: 3,
      key: "privacy",
      title: "গোপনীয়তা নীতি",
      body: `<p>সার্বভৌমত্ব আন্দোলন আপনার গোপনীয়তাকে সর্বোচ্চ গুরুত্ব দেয়। এই নীতিমালায় আমরা কীভাবে আপনার তথ্য সংগ্রহ, ব্যবহার ও সুরক্ষা করি তা বর্ণিত হয়েছে।</p>
<h2>তথ্য সংগ্রহ</h2>
<p>আমরা শুধুমাত্র সেই তথ্যই সংগ্রহ করি যা আমাদের সেবা প্রদানের জন্য প্রয়োজন।</p>
<h2>তথ্যের ব্যবহার</h2>
<p>সংগৃহীত তথ্য আপনাকে আরও ভালো সেবা দেওয়ার জন্য ব্যবহার করা হয়। আমরা কখনো তৃতীয় পক্ষের কাছে আপনার তথ্য বিক্রি করি না।</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    en: {
      id: 3,
      key: "privacy",
      title: "Privacy Policy",
      body: `<p>The Sovereignty Movement places the utmost importance on your privacy. This policy describes how we collect, use, and protect your information.</p>
<h2>Information Collection</h2>
<p>We only collect information that is necessary to provide our services.</p>
<h2>Use of Information</h2>
<p>Collected information is used to provide you with better service. We never sell your information to third parties.</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    ar: null,
  },
  terms: {
    bn: {
      id: 4,
      key: "terms",
      title: "শর্তাবলী",
      body: `<p>সার্বভৌমত্ব ওয়েবসাইট ব্যবহার করে আপনি নিচে উল্লিখিত শর্তাবলীতে সম্মত হচ্ছেন।</p>
<h2>ব্যবহারের শর্ত</h2>
<p>এই ওয়েবসাইটে প্রকাশিত সকল বিষয়বস্তু সার্বভৌমত্ব আন্দোলনের সম্পত্তি। বিনা অনুমতিতে ব্যবহার নিষিদ্ধ।</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    en: {
      id: 4,
      key: "terms",
      title: "Terms of Service",
      body: `<p>By using the Sovereignty website, you agree to the terms and conditions listed below.</p>
<h2>Terms of Use</h2>
<p>All content published on this website is the property of the Sovereignty Movement. Use without permission is prohibited.</p>`,
      sections: null,
      seoTitle: null,
      metaDescription: null,
      ogTitle: null,
      ogDescription: null,
      ogImageId: null,
    },
    ar: null,
  },
};
