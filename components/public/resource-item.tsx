/**
 * Row component for the resources list page.
 * Resources are displayed as a vertical list, not a card grid.
 */

import type { ResourceListItem } from "@/lib/data/public/resources";
import type { Locale } from "@/lib/i18n/config";

interface ResourceItemProps {
  resource: ResourceListItem;
  locale: Locale;
}

const kindLabel: Record<string, string> = {
  pdf: "PDF",
  doc: "DOC",
  link: "Link",
};

const kindIcon: Record<string, string> = {
  pdf: "📄",
  doc: "📝",
  link: "🔗",
};

export function ResourceItem({ resource, locale }: ResourceItemProps) {
  void locale;

  // Determine the download/external URL
  const href =
    resource.kind === "link"
      ? resource.externalUrl ?? "#"
      : resource.fileMediaId
        ? `/api/media/${resource.fileMediaId}/download`
        : "#";

  const isExternal = resource.kind === "link";

  return (
    <li className="group flex items-start gap-4 rounded-xl border border-[--color-border] bg-[--color-bg-card] p-4 transition-shadow hover:shadow-md">
      <span
        className="mt-0.5 text-2xl"
        aria-hidden="true"
      >
        {kindIcon[resource.kind] ?? "📎"}
      </span>

      <div className="min-w-0 flex-1">
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-semibold text-[--color-text-primary] hover:text-[--color-brand-deep] hover:underline"
        >
          {resource.title}
        </a>

        {resource.description && (
          <p className="mt-1 line-clamp-2 text-sm text-[--color-text-secondary]">
            {resource.description}
          </p>
        )}
      </div>

      <span className="shrink-0 rounded-full bg-[--color-bg-subtle] px-2.5 py-0.5 text-xs font-medium text-[--color-text-muted]">
        {kindLabel[resource.kind] ?? resource.kind.toUpperCase()}
      </span>
    </li>
  );
}
