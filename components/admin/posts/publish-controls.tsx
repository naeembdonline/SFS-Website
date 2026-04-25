"use client";

/**
 * Per-locale publish / unpublish controls + delete for a post.
 * Each action is a separate <form> wrapping a submit button,
 * so they work without JavaScript (progressive enhancement).
 */

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  publishPostAction,
  unpublishPostAction,
  deletePostAction,
} from "@/lib/actions/posts";
import { useActionToast } from "@/components/admin/toast";
import type { Locale } from "@/lib/i18n/config";
import type { AdminTranslation } from "@/lib/data/admin/posts";
import type { ActionState } from "@/lib/auth/with-admin";
import { cn } from "@/lib/utils/cn";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PublishControlsProps {
  postId: number;
  translations: AdminTranslation[];
}

const LOCALE_LABELS: Record<Locale, string> = {
  bn: "Bangla",
  en: "English",
  ar: "Arabic",
};

// ─── Component ────────────────────────────────────────────────────────────────

export function PublishControls({ postId, translations }: PublishControlsProps) {
  const translationMap = new Map(translations.map((t) => [t.locale, t]));

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      {/* Header */}
      <div className="border-b border-neutral-100 px-5 py-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Publishing
        </h2>
      </div>

      {/* Per-locale rows */}
      <div className="divide-y divide-neutral-100">
        {(["bn", "en", "ar"] as Locale[]).map((locale) => {
          const t = translationMap.get(locale);
          const isPublished = t?.status === "published";
          const hasMissingFields =
            !t?.title || !t?.body || !t?.metaDescription;

          return (
            <LocaleRow
              key={locale}
              postId={postId}
              locale={locale}
              label={LOCALE_LABELS[locale]}
              isPublished={isPublished}
              hasMissingFields={hasMissingFields && !isPublished}
            />
          );
        })}
      </div>

      {/* Danger zone — delete */}
      <div className="border-t border-neutral-100 px-5 py-4">
        <DeletePostForm postId={postId} />
      </div>
    </div>
  );
}

// ─── LocaleRow ────────────────────────────────────────────────────────────────

function LocaleRow({
  postId,
  locale,
  label,
  isPublished,
  hasMissingFields,
}: {
  postId: number;
  locale: Locale;
  label: string;
  isPublished: boolean;
  hasMissingFields: boolean;
}) {
  const action = isPublished ? unpublishPostAction : publishPostAction;
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    null
  );
  const router = useRouter();
  useActionToast(state, {
    success: isPublished ? `${label} unpublished.` : `${label} published.`,
  });

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [router, state]);

  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-2.5">
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            isPublished ? "bg-green-500" : "bg-yellow-400"
          )}
        />
        <span className="text-sm text-neutral-700">{label}</span>
        {isPublished && (
          <span className="rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
            Live
          </span>
        )}
      </div>

      <div className="flex flex-col items-end gap-1">
        <form action={formAction}>
          <input type="hidden" name="postId" value={postId} />
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
              "rounded-md px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
              isPublished
                ? "text-neutral-500 hover:bg-red-50 hover:text-red-600"
                : "bg-[#0B3D2E] text-white hover:bg-[#0a3527]"
            )}
          >
            {isPending ? "…" : isPublished ? "Unpublish" : "Publish"}
          </button>
        </form>

        {state && !state.ok && (
          <p className="max-w-[180px] text-right text-[11px] text-red-500">
            {state.error}
          </p>
        )}
      </div>
    </div>
  );
}

// ─── DeletePostForm ───────────────────────────────────────────────────────────

function DeletePostForm({ postId }: { postId: number }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    deletePostAction,
    null
  );

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    if (
      !confirm(
        "Are you sure you want to delete this post? This action can be undone by an admin."
      )
    ) {
      e.preventDefault();
    }
  };

  return (
    <div>
      <p className="mb-2 text-xs text-neutral-400">
        Soft-delete moves the post to trash. It will no longer appear on the public site.
      </p>
      <form action={formAction} onSubmit={handleSubmit}>
        <input type="hidden" name="postId" value={postId} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Delete post"}
        </button>
      </form>
      {state && !state.ok && (
        <p className="mt-1 text-[11px] text-red-500">{state.error}</p>
      )}
    </div>
  );
}
