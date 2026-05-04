/**
 * Card component for campaigns list page.
 */

import Link from "next/link";
import type { CampaignListItem } from "@/lib/data/public/campaigns";
import type { Locale } from "@/lib/i18n/config";

interface CampaignCardProps {
  campaign: CampaignListItem;
  locale: Locale;
}

const VIEW_DETAILS: Record<Locale, string> = {
  bn: "বিস্তারিত দেখুন",
  en: "View details",
  ar: "عرض التفاصيل",
};

const STATUS_LABELS: Record<Locale, { active: string; past: string }> = {
  bn: { active: "চলমান", past: "সমাপ্ত" },
  en: { active: "Active", past: "Past" },
  ar: { active: "نشط", past: "منتهي" },
};

export function CampaignCard({ campaign, locale }: CampaignCardProps) {
  const href = `/${locale}/campaigns/${campaign.slug}`;
  const isActive = campaign.statusLifecycle === "active";
  const statusLabels = STATUS_LABELS[locale] ?? STATUS_LABELS.en;
  const viewDetails = VIEW_DETAILS[locale] ?? VIEW_DETAILS.en;

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "#e5e7eb" }}
    >
      {/* Status badge */}
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
        <span
          className="rounded-full px-3 py-1"
          style={
            isActive
              ? {
                  backgroundColor: "rgba(46,204,113,0.12)",
                  color: "#16a34a",
                }
              : {
                  backgroundColor: "rgba(0,0,0,0.06)",
                  color: "#6b7280",
                }
          }
        >
          {isActive ? statusLabels.active : statusLabels.past}
        </span>
        {campaign.startDate && (
          <span className="text-neutral-400">{campaign.startDate.slice(0, 7)}</span>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-lg font-bold leading-snug transition-colors group-hover:underline"
        style={{ color: "var(--color-brand-black)" }}
      >
        <Link href={href} className="after:absolute after:inset-0">
          {campaign.title}
        </Link>
      </h3>

      {/* Excerpt */}
      {campaign.excerpt && (
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-500">
          {campaign.excerpt}
        </p>
      )}

      {/* CTA */}
      <div
        className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--color-accent-gold)" }}
      >
        <span>{viewDetails}</span>
        <span
          className="inline-block transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </article>
  );
}
