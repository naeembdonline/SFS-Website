"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import type { Locale } from "@/lib/i18n/config";

interface LocaleTabsProps {
  statuses: Record<Locale, "missing" | "draft" | "published">;
  children: (activeLocale: Locale) => React.ReactNode;
}

const LOCALE_LABELS: Record<Locale, string> = {
  bn: "বাংলা",
  en: "English",
  ar: "العربية",
};

const STATUS_DOT: Record<"missing" | "draft" | "published", string> = {
  missing: "bg-neutral-300",
  draft: "bg-yellow-400",
  published: "bg-green-500",
};

const STATUS_LABEL: Record<"missing" | "draft" | "published", string> = {
  missing: "No content",
  draft: "Draft",
  published: "Published",
};

export function LocaleTabs({ statuses, children }: LocaleTabsProps) {
  const [active, setActive] = useState<Locale>("bn");

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-neutral-200">
        {(["bn", "en", "ar"] as Locale[]).map((locale) => (
          <button
            key={locale}
            type="button"
            onClick={() => setActive(locale)}
            className={cn(
              "flex items-center gap-2 border-b-2 px-5 py-3 text-sm font-medium transition-colors",
              active === locale
                ? "border-[#0B3D2E] text-[#0B3D2E]"
                : "border-transparent text-neutral-500 hover:text-neutral-700"
            )}
          >
            {/* Status dot */}
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                STATUS_DOT[statuses[locale]]
              )}
              title={STATUS_LABEL[statuses[locale]]}
            />
            {LOCALE_LABELS[locale]}
          </button>
        ))}
      </div>

      {/* Status hint */}
      <div className="flex gap-4 border-b border-neutral-100 bg-neutral-50 px-5 py-1.5 text-[11px] text-neutral-400">
        {(["missing", "draft", "published"] as const).map((s) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_DOT[s])} />
            {STATUS_LABEL[s]}
          </span>
        ))}
      </div>

      {/* Panel */}
      <div
        dir={active === "ar" ? "rtl" : "ltr"}
        lang={active}
        className="pt-6"
      >
        {children(active)}
      </div>
    </div>
  );
}
