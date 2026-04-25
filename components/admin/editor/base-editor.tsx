"use client";

import { useEffect, useRef, useTransition, type ReactNode } from "react";
import { useActionToast } from "@/components/admin/toast";
import { LocaleTabs } from "./locale-tabs";
import type { Locale } from "@/lib/i18n/config";

export type LocaleStatus = "missing" | "draft" | "published";

export function EditorShell({
  formAction,
  isEditing,
  isPending,
  state,
  createLabel,
  editLabel,
  createHint,
  editHint,
  enableAutosave = false,
  topSection,
  children,
}: {
  formAction: (payload: FormData) => void;
  isEditing: boolean;
  isPending: boolean;
  state: { ok: boolean; error?: string } | null;
  createLabel: string;
  editLabel: string;
  createHint: string;
  editHint: string;
  enableAutosave?: boolean;
  topSection?: ReactNode;
  children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const dirtyRef = useRef(false);
  const [, startTransition] = useTransition();

  useActionToast(state, {
    success: isEditing ? "Changes saved." : "Created successfully.",
  });

  useEffect(() => {
    if (!enableAutosave || !isEditing) return;

    const interval = window.setInterval(() => {
      if (!dirtyRef.current || isPending || !formRef.current) return;
      dirtyRef.current = false;
      const formData = new FormData(formRef.current);
      startTransition(() => {
        formAction(formData);
      });
    }, 30_000);

    return () => window.clearInterval(interval);
  }, [enableAutosave, formAction, isEditing, isPending, startTransition]);

  return (
    <form
      ref={formRef}
      action={(formData) => {
        dirtyRef.current = false;
        formAction(formData);
      }}
      onInput={() => {
        dirtyRef.current = true;
      }}
      className="space-y-6"
    >
      {topSection}

      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          <span className="font-medium">Error:</span> {state.error}
        </div>
      )}

      {children}

      <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-6 py-4">
        <span className="text-xs text-neutral-400">{isEditing ? editHint : createHint}</span>
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-[#0B3D2E] px-5 py-2 text-sm font-medium text-white hover:bg-[#0a3527] disabled:opacity-50"
        >
          {isPending ? "Saving..." : isEditing ? editLabel : createLabel}
        </button>
      </div>
    </form>
  );
}

export function LocaleEditorTabs({
  statuses,
  renderPanel,
}: {
  statuses: Record<Locale, LocaleStatus>;
  renderPanel: (locale: Locale, isActive: boolean) => ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
      <LocaleTabs statuses={statuses}>
        {(activeLocale) => (
          <>
            {(["bn", "en", "ar"] as Locale[]).map((locale) => (
              <div key={locale} className={locale === activeLocale ? "block" : "hidden"}>
                {renderPanel(locale, locale === activeLocale)}
              </div>
            ))}
          </>
        )}
      </LocaleTabs>
    </div>
  );
}

export function Field({
  label,
  children,
  required,
  hint,
}: {
  label: string;
  children: ReactNode;
  required?: boolean;
  hint?: string;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {hint && <p className="mb-2 text-xs text-neutral-400">{hint}</p>}
      {children}
    </div>
  );
}

export function SeoFields({
  locale,
  disabled,
  initial,
}: {
  locale: Locale;
  disabled?: boolean;
  initial?: {
    seoTitle?: string | null;
    metaDescription?: string | null;
    ogTitle?: string | null;
    ogDescription?: string | null;
  };
}) {
  return (
    <details className="group">
      <summary className="mb-4 cursor-pointer select-none text-xs font-semibold uppercase tracking-wider text-neutral-400 hover:text-neutral-600">
        SEO & Open Graph
      </summary>
      <div className="space-y-4">
        <Field label="SEO title" hint="Falls back to title if empty">
          <input
            name={`${locale}_seo_title`}
            type="text"
            defaultValue={initial?.seoTitle ?? ""}
            disabled={disabled}
            maxLength={200}
            className={inputCls}
          />
        </Field>
        <Field label="Meta description" hint="Shown in search results (max 300 chars)">
          <textarea
            name={`${locale}_meta_description`}
            defaultValue={initial?.metaDescription ?? ""}
            disabled={disabled}
            rows={2}
            maxLength={300}
            className={inputCls}
          />
        </Field>
        <Field label="OG title">
          <input
            name={`${locale}_og_title`}
            type="text"
            defaultValue={initial?.ogTitle ?? ""}
            disabled={disabled}
            maxLength={200}
            className={inputCls}
          />
        </Field>
        <Field label="OG description">
          <textarea
            name={`${locale}_og_description`}
            defaultValue={initial?.ogDescription ?? ""}
            disabled={disabled}
            rows={2}
            maxLength={300}
            className={inputCls}
          />
        </Field>
      </div>
    </details>
  );
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\p{L}\p{N}-]/gu, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const inputCls =
  "w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 disabled:opacity-60";
