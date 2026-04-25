"use client";

import { useActionState } from "react";
import { publishPageAction, unpublishPageAction } from "@/lib/actions/pages";
import type { Locale } from "@/lib/i18n/config";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminPageTranslation } from "@/lib/data/admin/pages";
import { cn } from "@/lib/utils/cn";

export function PagePublishControls({
  pageId,
  translations,
}: {
  pageId: number;
  translations: AdminPageTranslation[];
}) {
  const translationMap = new Map(translations.map((t) => [t.locale, t]));

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <div className="border-b border-neutral-100 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Publishing
        </h2>
      </div>

      <div className="divide-y divide-neutral-100">
        {(["bn", "en", "ar"] as Locale[]).map((locale) => {
          const t = translationMap.get(locale);
          const isPublished = t?.status === "published";
          const hasTitle = Boolean(t?.title?.trim());
          return (
            <LocaleRow
              key={locale}
              pageId={pageId}
              locale={locale}
              isPublished={isPublished}
              canPublish={hasTitle}
            />
          );
        })}
      </div>
    </div>
  );
}

function LocaleRow({
  pageId,
  locale,
  isPublished,
  canPublish,
}: {
  pageId: number;
  locale: Locale;
  isPublished: boolean;
  canPublish: boolean;
}) {
  const action = isPublished ? unpublishPageAction : publishPageAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    null
  );

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="uppercase text-sm text-neutral-700">{locale}</span>
      <div className="flex flex-col items-end gap-1">
        <form action={formAction}>
          <input type="hidden" name="pageId" value={pageId} />
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            disabled={isPending || (!isPublished && !canPublish)}
            title={!canPublish && !isPublished ? "Add a title before publishing" : undefined}
            className={cn(
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-40",
              isPublished
                ? "text-neutral-500 hover:bg-red-50 hover:text-red-600"
                : "bg-[#0B3D2E] text-white hover:bg-[#0a3527]"
            )}
          >
            {isPending ? "..." : isPublished ? "Unpublish" : "Publish"}
          </button>
        </form>
        {state && !state.ok && (
          <p className="text-[11px] text-red-500">{state.error}</p>
        )}
      </div>
    </div>
  );
}
