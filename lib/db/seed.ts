/**
 * Database seed script — dev/initial setup only.
 * Never runs in production automatically.
 *
 * Usage:
 *   SEED_ADMIN_EMAIL=admin@example.com \
 *   SEED_ADMIN_PASSWORD=YourSecurePassword123! \
 *   DATABASE_URL=postgres://... \
 *   npx tsx lib/db/seed.ts
 *
 * What it inserts:
 *   1. site_settings singleton (id = 1) + translations (BN/EN/AR)
 *   2. Core pages: home, about, contact, privacy, terms
 *   3. Initial admin user (email + bcryptjs-hashed password)
 *   4. Header + footer navigation items with translations
 *
 * Safe to re-run: uses ON CONFLICT DO NOTHING on unique keys.
 */

import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

// ─── Validate env ─────────────────────────────────────────────────────────────

const DATABASE_URL = process.env.DATABASE_URL;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;

if (!DATABASE_URL) throw new Error("DATABASE_URL is required");
if (!ADMIN_EMAIL) throw new Error("SEED_ADMIN_EMAIL is required");
if (!ADMIN_PASSWORD) throw new Error("SEED_ADMIN_PASSWORD is required");
if (ADMIN_PASSWORD.length < 12)
  throw new Error("SEED_ADMIN_PASSWORD must be at least 12 characters");

// Narrow to string after guards
const adminEmail: string = ADMIN_EMAIL;
const adminPassword: string = ADMIN_PASSWORD;

const pool = new Pool({
  connectionString: DATABASE_URL,
});

const db = drizzle(pool, { schema });

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  console.log("🌱 Starting seed...\n");

  // 1. Site settings singleton ────────────────────────────────────────────────

  console.log("  → site_settings");
  await db
    .insert(schema.siteSettings)
    .values({
      id: 1,
      contactEmail: adminEmail,
      socials: [],
    })
    .onConflictDoNothing();

  // 1a. Site settings translations
  const settingsTranslations = [
    {
      locale: "bn" as const,
      siteName: "স্টুডেন্টস ফর সভরেন্টি",
      tagline: "সার্বভৌম, নিরাপদ ও স্বনির্ভর বাংলাদেশের জন্য একটি সচেতন ছাত্র সমাজ।",
      footerText: "© স্টুডেন্টস ফর সভরেন্টি। সর্বস্বত্ব সংরক্ষিত।",
      defaultMetaDescription:
        "জাতীয় স্বার্থ ও সার্বভৌমত্ব রক্ষায় নিয়োজিত স্টুডেন্টস ফর সভরেন্টি-এর অফিসিয়াল ওয়েবসাইট।",
    },
    {
      locale: "en" as const,
      siteName: "Students for Sovereignty",
      tagline: "Building a conscious student society for a sovereign and secure state.",
      footerText: "© Students for Sovereignty. All rights reserved.",
      defaultMetaDescription:
        "Official website of Students for Sovereignty, a student-led organization dedicated to national interest and sovereignty.",
    },
    {
      locale: "ar" as const,
      siteName: "طلاب من أجل السيادة",
      tagline: "بناء مجتمع طلابي واعٍ من أجل دولة ذات سيادة وآمنة.",
      footerText: "© طلاب من أجل السيادة. جميع الحقوق محفوظة.",
      defaultMetaDescription: "الموقع الرسمي لمنظمة 'طلاب من أجل السيادة'، وهي منظمة طلابية مكرسة للمصلحة الوطنية والسيادة.",
    },
  ];

  for (const t of settingsTranslations) {
    await db
      .insert(schema.siteSettingsTranslations)
      .values(t)
      .onConflictDoNothing();
  }
  console.log("     ✓ site_settings + 3 locale translations\n");

  // 2. Core pages ──────────────────────────────────────────────────────────────

  console.log("  → pages");
  const pageKeys = ["home", "about", "contact", "privacy", "terms"] as const;

  for (const key of pageKeys) {
    await db
      .insert(schema.pages)
      .values({ key })
      .onConflictDoNothing();
    console.log(`     ✓ page: ${key}`);
  }
  console.log();

  // 3. Admin user ──────────────────────────────────────────────────────────────

  console.log("  → admin user");
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await db
    .insert(schema.users)
    .values({
      email: adminEmail,
      passwordHash,
      role: "admin",
      displayName: "Admin",
      isActive: true,
      totpEnabled: false,
      failedLoginCount: 0,
    })
    .onConflictDoNothing();

  console.log(`     ✓ admin user: ${adminEmail}`);
  console.log(
    "     ⚠  2FA not yet enrolled — admin must enroll on first login\n"
  );

  // 4. Navigation items ────────────────────────────────────────────────────────

  console.log("  → navigation_items");

  // Header items
  const headerItems = [
    { routeKey: "about", order: 1, labelBn: "আমাদের সম্পর্কে", labelEn: "About", labelAr: "من نحن" },
    { routeKey: "leadership", order: 2, labelBn: "নেতৃত্ব", labelEn: "Leadership", labelAr: "القيادة" },
    { routeKey: "campaigns", order: 3, labelBn: "প্রচারাভিযান", labelEn: "Campaigns", labelAr: "الحملات" },
    { routeKey: "news", order: 4, labelBn: "সংবাদ", labelEn: "News", labelAr: "الأخبار" },
    { routeKey: "blog", order: 5, labelBn: "ব্লগ", labelEn: "Blog", labelAr: "المدونة" },
    { routeKey: "resources", order: 6, labelBn: "সম্পদ", labelEn: "Resources", labelAr: "الموارد" },
    { routeKey: "contact", order: 7, labelBn: "যোগাযোগ", labelEn: "Contact", labelAr: "اتصل بنا" },
  ];

  for (const item of headerItems) {
    const [inserted] = await db
      .insert(schema.navigationItems)
      .values({
        menu: "header",
        displayOrder: item.order,
        linkKind: "route",
        routeKey: item.routeKey,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.navigationItems.id });

    if (inserted) {
      await db.insert(schema.navigationItemTranslations).values([
        { navigationItemId: inserted.id, locale: "bn", label: item.labelBn },
        { navigationItemId: inserted.id, locale: "en", label: item.labelEn },
        { navigationItemId: inserted.id, locale: "ar", label: item.labelAr },
      ]).onConflictDoNothing();
    }
    console.log(`     ✓ header: ${item.routeKey}`);
  }

  // Footer items — Organisation column
  const footerOrgItems = [
    { routeKey: "about", order: 1, labelBn: "আমাদের সম্পর্কে", labelEn: "About", labelAr: "من نحن" },
    { routeKey: "leadership", order: 2, labelBn: "নেতৃত্ব", labelEn: "Leadership", labelAr: "القيادة" },
    { routeKey: "contact", order: 3, labelBn: "যোগাযোগ", labelEn: "Contact", labelAr: "اتصل بنا" },
  ];

  // Footer items — Publishing column
  const footerPubItems = [
    { routeKey: "news", order: 4, labelBn: "সংবাদ", labelEn: "News", labelAr: "الأخبار" },
    { routeKey: "blog", order: 5, labelBn: "ব্লগ", labelEn: "Blog", labelAr: "المدونة" },
    { routeKey: "campaigns", order: 6, labelBn: "প্রচারাভিযান", labelEn: "Campaigns", labelAr: "الحملات" },
    { routeKey: "resources", order: 7, labelBn: "সম্পদ", labelEn: "Resources", labelAr: "الموارد" },
  ];

  // Footer items — Legal column
  const footerLegalItems = [
    { routeKey: "privacy", order: 8, labelBn: "গোপনীয়তা নীতি", labelEn: "Privacy Policy", labelAr: "سياسة الخصوصية" },
    { routeKey: "terms", order: 9, labelBn: "শর্তাবলী", labelEn: "Terms", labelAr: "الشروط والأحكام" },
  ];

  for (const item of [...footerOrgItems, ...footerPubItems, ...footerLegalItems]) {
    const [inserted] = await db
      .insert(schema.navigationItems)
      .values({
        menu: "footer",
        displayOrder: item.order,
        linkKind: "route",
        routeKey: item.routeKey,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.navigationItems.id });

    if (inserted) {
      await db.insert(schema.navigationItemTranslations).values([
        { navigationItemId: inserted.id, locale: "bn", label: item.labelBn },
        { navigationItemId: inserted.id, locale: "en", label: item.labelEn },
        { navigationItemId: inserted.id, locale: "ar", label: item.labelAr },
      ]).onConflictDoNothing();
    }
    console.log(`     ✓ footer: ${item.routeKey}`);
  }

  // 5. Leadership ──────────────────────────────────────────────────────────────

  console.log("\n  → leadership");

  const leadershipMembers = [
    {
      order: 1,
      translations: [
        { locale: "bn" as const, name: "মুহম্মদ জিয়াউল হক", roleTitle: "কেন্দ্রীয় আহ্বায়ক", bio: "সাবেক শিক্ষার্থী, ঢাকা বিশ্ববিদ্যালয়।" },
        { locale: "en" as const, name: "Muhammad Ziaul Haq", roleTitle: "Central Convener", bio: "Former student, University of Dhaka." },
        { locale: "ar" as const, name: "محمد ضياء الحق", roleTitle: "المنسق المركزي", bio: "طالب سابق بجامعة دكا." },
      ],
    },
    {
      order: 2,
      translations: [
        { locale: "bn" as const, name: "মুহম্মদ মুহিউদদীন রাহাত", roleTitle: "ঢাবি আহ্বায়ক", bio: "মাস্টার্স শিক্ষার্থী, অপরাধবিজ্ঞান বিভাগ, ঢাকা বিশ্ববিদ্যালয়।" },
        { locale: "en" as const, name: "Muhammad Mohiuddin Rahat", roleTitle: "DU Convener", bio: "Masters student, Criminology, University of Dhaka." },
        { locale: "ar" as const, name: "محمد محيي الدين راحت", roleTitle: "منسق جامعة دكا", bio: "طالب ماجستير، قسم علم الجريمة، جامعة دكا." },
      ],
    },
  ];

  for (const member of leadershipMembers) {
    const [inserted] = await db
      .insert(schema.leadership)
      .values({
        displayOrder: member.order,
        isVisible: true,
      })
      .onConflictDoNothing()
      .returning({ id: schema.leadership.id });

    if (inserted) {
      await db.insert(schema.leadershipTranslations).values(
        member.translations.map((t) => ({
          leadershipId: inserted.id,
          ...t,
        }))
      ).onConflictDoNothing();
    }
    console.log(`     ✓ leadership: ${member.translations.find(t => t.locale === 'en')?.name}`);
  }

  console.log("\n✅ Seed complete.\n");
  console.log("Next steps:");
  console.log("  1. Log in at /admin/login with the email you provided");
  console.log("  2. Enroll 2FA immediately (required for admin role)");
  console.log("  3. Update site name and tagline in /admin/settings");
  await pool.end();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
