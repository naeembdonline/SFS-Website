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

export function CampaignCard({ campaign, locale }: CampaignCardProps) {
  const href = `/${locale}/campaigns/${campaign.slug}`;
  const isActive = campaign.statusLifecycle === "active";

  return (
    <article className="group relative flex flex-col gap-4 rounded-xl border border-neutral-100/10 bg-[--color-bg-card] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[--color-accent-gold]/30 hover:shadow-lg">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
        <span
          className={`inline-block rounded-md px-2 py-1 font-bold ${
            isActive
              ? "bg-[--color-accent-green]/15 text-[--color-accent-green]"
              : "bg-[--color-text-muted]/10 text-[--color-text-muted]"
          }`}
        >
          {campaign.statusLifecycle}
        </span>
        {campaign.startDate && (
          <time className="text-[--color-text-muted] font-medium">
            {campaign.startDate}
          </time>
        )}
      </div>

      <h3 className="text-xl font-bold leading-tight text-[--color-text-primary] transition-colors group-hover:text-[--color-brand-deep]">
        <Link href={href} className="after:absolute after:inset-0">
          {campaign.title}
        </Link>
      </h3>

      {campaign.excerpt && (
        <p className="line-clamp-3 text-sm leading-relaxed text-[--color-text-secondary]">
          {campaign.excerpt}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-2 text-sm font-bold text-[--color-accent-gold]">
        <span className="uppercase tracking-widest">বিস্তারিত দেখুন</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </article>
  );
}
