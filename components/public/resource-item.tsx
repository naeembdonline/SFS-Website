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

const kindColor: Record<string, { bg: string; text: string }> = {
  pdf: { bg: "rgba(239,68,68,0.10)", text: "#dc2626" },
  doc: { bg: "rgba(59,130,246,0.10)", text: "#2563eb" },
  link: { bg: "rgba(16,185,129,0.10)", text: "#059669" },
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
  const color = kindColor[resource.kind] ?? { bg: "rgba(0,0,0,0.06)", text: "#6b7280" };

  return (
    <li
      className="group flex items-start gap-4 rounded-xl border bg-white p-5 transition-shadow hover:shadow-md"
      style={{ borderColor: "#e5e7eb" }}
    >
      <span className="mt-0.5 text-2xl" aria-hidden="true">
        {kindIcon[resource.kind] ?? "📎"}
      </span>

      <div className="min-w-0 flex-1">
        <a
          href={href}
          target={isExternal ? "_blank" : undefined}
          rel={isExternal ? "noopener noreferrer" : undefined}
          className="font-semibold transition-colors hover:underline"
          style={{ color: "var(--color-brand-black)" }}
        >
          {resource.title}
        </a>

        {resource.description && (
          <p className="mt-1 line-clamp-2 text-sm text-neutral-500">
            {resource.description}
          </p>
        )}

        {resource.publishedAt && (
          <p className="mt-1.5 text-xs text-neutral-400">
            {resource.publishedAt.toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </p>
        )}
      </div>

      <span
        className="shrink-0 rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wide"
        style={{ backgroundColor: color.bg, color: color.text }}
      >
        {kindLabel[resource.kind] ?? resource.kind.toUpperCase()}
      </span>
    </li>
  );
}
