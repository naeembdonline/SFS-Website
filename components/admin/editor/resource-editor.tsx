"use client";

import { useActionState, useCallback, useRef, useState } from "react";
import { createResourceAction, updateResourceAction } from "@/lib/actions/resources";
import type { Locale } from "@/lib/i18n/config";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminResourceTranslation, ResourceKind } from "@/lib/data/admin/resources";
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

interface ResourceEditorProps {
  resourceId?: number;
  kind?: ResourceKind;
  fileMediaId?: number | null;
  externalUrl?: string | null;
  translations?: AdminResourceTranslation[];
}

export function ResourceEditor({
  resourceId,
  kind,
  fileMediaId,
  externalUrl,
  translations,
}: ResourceEditorProps) {
  const isEditing = Boolean(resourceId);
  const action = isEditing ? updateResourceAction.bind(null, resourceId!) : createResourceAction;
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

  const initial = new Map<string, AdminResourceTranslation>();
  if (translations) {
    for (const t of translations) initial.set(t.locale, t);
  }

  return (
    <EditorShell
      formAction={formAction}
      isEditing={isEditing}
      isPending={isPending}
      state={state}
      createLabel="Create resource"
      editLabel="Save changes"
      createHint="New resource will be saved as draft"
      editHint="Changes are saved as draft"
      topSection={(
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-5 md:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Kind
            <select name="kind" defaultValue={kind ?? "pdf"} disabled={isPending} className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900">
              <option value="pdf">PDF</option>
              <option value="doc">DOC</option>
              <option value="link">Link</option>
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            File media ID
            <input type="number" min={1} name="fileMediaId" defaultValue={fileMediaId ?? ""} disabled={isPending} className={cn(inputCls, "mt-1.5")} />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            External URL
            <input type="url" name="externalUrl" defaultValue={externalUrl ?? ""} disabled={isPending} className={cn(inputCls, "mt-1.5")} />
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
  initial?: AdminResourceTranslation;
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

      <Field label="Description">
        <textarea name={`${locale}_description`} defaultValue={initial?.description ?? ""} disabled={disabled} rows={5} className={inputCls} />
      </Field>

      <SeoFields locale={locale} disabled={disabled} initial={initial} />
    </div>
  );
}
