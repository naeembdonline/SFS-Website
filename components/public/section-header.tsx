/**
 * Reusable section header — large heading + optional subtitle.
 * Used on list pages (blog, news, campaigns, resources, leadership).
 */

import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
  /** If true, renders as h2 (for within-page sections). Default is h1 (page-level). */
  as?: "h1" | "h2";
}

export function SectionHeader({
  title,
  description,
  className,
  as: Tag = "h1",
}: SectionHeaderProps) {
  return (
    <div className={cn(className)}>
      <Tag
        className="text-3xl font-bold tracking-tight md:text-4xl"
        style={{ color: "var(--color-brand-black)" }}
      >
        {title}
      </Tag>
      {description && (
        <p className="mt-3 text-base leading-relaxed text-neutral-500">
          {description}
        </p>
      )}
    </div>
  );
}
