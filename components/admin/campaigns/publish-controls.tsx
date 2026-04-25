"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  publishCampaignAction,
  unpublishCampaignAction,
  deleteCampaignAction,
} from "@/lib/actions/campaigns";
import { useActionToast } from "@/components/admin/toast";
import type { Locale } from "@/lib/i18n/config";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminCampaignTranslation } from "@/lib/data/admin/campaigns";
import { cn } from "@/lib/utils/cn";

export function CampaignPublishControls({
  campaignId,
  translations,
}: {
  campaignId: number;
  translations: AdminCampaignTranslation[];
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
          const hasMissingFields = !t?.title || !t?.body || !t?.metaDescription;
          return (
            <LocaleRow
              key={locale}
              campaignId={campaignId}
              locale={locale}
              isPublished={isPublished}
              hasMissingFields={hasMissingFields && !isPublished}
            />
          );
        })}
      </div>

      <div className="border-t border-neutral-100 px-5 py-4">
        <DeleteCampaignForm campaignId={campaignId} />
      </div>
    </div>
  );
}

function LocaleRow({
  campaignId,
  locale,
  isPublished,
  hasMissingFields,
}: {
  campaignId: number;
  locale: Locale;
  isPublished: boolean;
  hasMissingFields: boolean;
}) {
  const action = isPublished ? unpublishCampaignAction : publishCampaignAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(action, null);
  const router = useRouter();
  useActionToast(state, {
    success: isPublished ? `${locale.toUpperCase()} unpublished.` : `${locale.toUpperCase()} published.`,
  });

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <span className="text-sm text-neutral-700 uppercase">{locale}</span>
      <div className="flex flex-col items-end gap-1">
        <form action={formAction}>
          <input type="hidden" name="campaignId" value={campaignId} />
          <input type="hidden" name="locale" value={locale} />
          <button
            type="submit"
            disabled={isPending}
            title={
              hasMissingFields && !isPublished
                ? "Title, body, and meta description are required before publishing"
                : undefined
            }
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
        {state && !state.ok && <p className="text-[11px] text-red-500">{state.error}</p>}
      </div>
    </div>
  );
}

function DeleteCampaignForm({ campaignId }: { campaignId: number }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    deleteCampaignAction,
    null
  );

  return (
    <div>
      <form
        action={formAction}
        onSubmit={(e) => {
          if (!confirm("Delete this campaign? This is a soft delete.")) e.preventDefault();
        }}
      >
        <input type="hidden" name="campaignId" value={campaignId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "Deleting..." : "Delete campaign"}
        </button>
      </form>
      {state && !state.ok && <p className="mt-1 text-[11px] text-red-500">{state.error}</p>}
    </div>
  );
}
