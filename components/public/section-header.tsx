/**
 * Reusable section header — large heading + optional subtitle.
 * Used on list pages (blog, news, campaigns, resources, leadership).
 */

import { cn } from "@/lib/utils/cn";

interface SectionHeaderProps {
  title: string;
  description?: string;
  className?: string;
}

export function SectionHeader({
  title,
  description,
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("mb-10 border-b border-[--color-border] pb-8", className)}>
      <h1 className="text-4xl font-bold tracking-tight text-[--color-text-primary] md:text-5xl">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-2xl text-lg text-[--color-text-muted]">
          {description}
        </p>
      )}
    </div>
  );
}
