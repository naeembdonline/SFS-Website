"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { createCampaignAction, updateCampaignAction } from "@/lib/actions/campaigns";
import type { Locale } from "@/lib/i18n/config";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminCampaignTranslation, CampaignLifecycle } from "@/lib/data/admin/campaigns";
import { cn } from "@/lib/utils/cn";
import {
  EditorShell,
  LocaleEditorTabs,
  Field,
  SeoFields,
  inputCls,
  slugify,
  type LocaleStatus,
} from "./base-editor";

interface CampaignEditorProps {
  campaignId?: number;
  statusLifecycle?: CampaignLifecycle;
  startDate?: string | null;
  endDate?: string | null;
  translations?: AdminCampaignTranslation[];
}

export function CampaignEditor({
  campaignId,
  statusLifecycle,
  startDate,
  endDate,
  translations,
}: CampaignEditorProps) {
  const isEditing = Boolean(campaignId);
  const action = isEditing ? updateCampaignAction.bind(null, campaignId!) : createCampaignAction;
  const [state, formAction, isPending] = useActionState<ActionState<{ id: number } | void>, FormData>(
    action as (
      prevState: ActionState<{ id: number } | void>,
      formData: FormData
    ) => Promise<ActionState<{ id: number } | void>>,
    null
  );

  const statuses: Record<Locale, LocaleStatus> = { bn: "missing", en: "missing", ar: "missing" };
  if (translations) {
    for (const t of translations) {
      statuses[t.locale] = t.status === "published" ? "published" : t.title ? "draft" : "missing";
    }
  }

  const initial = new Map<string, AdminCampaignTranslation>();
  if (translations) {
    for (const t of translations) initial.set(t.locale, t);
  }

  return (
    <EditorShell
      formAction={formAction}
      isEditing={isEditing}
      isPending={isPending}
      state={state}
      createLabel="Create campaign"
      editLabel="Save changes"
      createHint="New campaign will be saved as draft"
      editHint="Changes are saved as draft"
      topSection={(
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-5 md:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Lifecycle
            <select
              name="statusLifecycle"
              defaultValue={statusLifecycle ?? "active"}
              disabled={isPending}
              className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900"
            >
              <option value="active">Active</option>
              <option value="past">Past</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Start date
            <input type="date" name="startDate" defaultValue={startDate ?? ""} disabled={isPending} className={cn(inputCls, "mt-1.5")} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            End date
            <input type="date" name="endDate" defaultValue={endDate ?? ""} disabled={isPending} className={cn(inputCls, "mt-1.5")} />
          </label>
        </div>
      )}
    >
      <LocaleEditorTabs
        statuses={statuses}
        renderPanel={(locale) => <LocalePanel locale={locale} initial={initial.get(locale)} disabled={isPending} />}
      />
    </EditorShell>
  );
}

function LocalePanel({
  locale,
  initial,
  disabled,
}: {
  locale: Locale;
  initial?: AdminCampaignTranslation;
  disabled?: boolean;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const slugManuallyEdited = useRef(Boolean(initial?.slug));

  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (!slugManuallyEdited.current) setSlug(slugify(newTitle));
  }, []);

  const handleSlugChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    slugManuallyEdited.current = true;
    setSlug(e.target.value);
  }, []);

  return (
    <div className="space-y-6 px-6 pb-8">
      <Field label="Title" required>
        <input name={`${locale}_title`} type="text" value={title} onChange={handleTitleChange} disabled={disabled} className={inputCls} />
      </Field>

      <Field label="Slug" required>
        <div className="flex items-center rounded-md border border-neutral-300 bg-white focus-within:border-[#0B3D2E] focus-within:ring-2 focus-within:ring-[#0B3D2E]/20">
          <span className="select-none border-e border-neutral-200 px-3 py-2 text-xs text-neutral-400">/{locale}/</span>
          <input name={`${locale}_slug`} type="text" value={slug} onChange={handleSlugChange} disabled={disabled} className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none" />
        </div>
      </Field>

      <Field label="Excerpt">
        <textarea name={`${locale}_excerpt`} defaultValue={initial?.excerpt ?? ""} disabled={disabled} rows={2} className={inputCls} />
      </Field>

      <Field label="Body" required>
        <textarea name={`${locale}_body`} defaultValue={initial?.body ?? ""} disabled={disabled} rows={10} className={cn(inputCls, "font-mono text-xs leading-relaxed")} />
      </Field>

      <Field label="Goals">
        <textarea name={`${locale}_goals`} defaultValue={initial?.goals ?? ""} disabled={disabled} rows={4} className={inputCls} />
      </Field>

      <SeoFields locale={locale} disabled={disabled} initial={initial} />
    </div>
  );
}
