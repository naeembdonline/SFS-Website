"use client";

import { useActionState } from "react";
import { updatePageAction } from "@/lib/actions/pages";
import type { Locale } from "@/lib/i18n/config";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminPageTranslation } from "@/lib/data/admin/pages";
import {
  EditorShell,
  LocaleEditorTabs,
  Field,
  SeoFields,
  inputCls,
  type LocaleStatus,
} from "./base-editor";

interface PageEditorProps {
  pageId: number;
  pageKey: string;
  translations?: AdminPageTranslation[];
}

export function PageEditor({ pageId, pageKey, translations }: PageEditorProps) {
  const action = updatePageAction.bind(null, pageId);
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    action,
    null
  );

  const statuses: Record<Locale, LocaleStatus> = {
    bn: "missing",
    en: "missing",
    ar: "missing",
  };
  if (translations) {
    for (const t of translations) {
      statuses[t.locale] =
        t.status === "published" ? "published" : t.title ? "draft" : "missing";
    }
  }

  const initial = new Map<string, AdminPageTranslation>();
  if (translations) {
    for (const t of translations) initial.set(t.locale, t);
  }

  // Pages that use the sections JSONB field (home/about) vs body text
  const usesSections = pageKey === "home" || pageKey === "about";

  return (
    <EditorShell
      formAction={formAction}
      isEditing
      isPending={isPending}
      state={state}
      createLabel="Save"
      editLabel="Save changes"
      createHint=""
      editHint="Changes are saved as draft until published"
    >
      <LocaleEditorTabs
        statuses={statuses}
        renderPanel={(locale) => (
          <LocalePanel
            locale={locale}
            initial={initial.get(locale)}
            disabled={isPending}
            usesSections={usesSections}
          />
        )}
      />
    </EditorShell>
  );
}

function LocalePanel({
  locale,
  initial,
  disabled,
  usesSections,
}: {
  locale: Locale;
  initial?: AdminPageTranslation;
  disabled?: boolean;
  usesSections: boolean;
}) {
  const sectionsDefaultValue = initial?.sections
    ? JSON.stringify(initial.sections, null, 2)
    : "";

  return (
    <div className="space-y-6 px-6 pb-8">
      <Field label="Title" required>
        <input
          name={`${locale}_title`}
          type="text"
          defaultValue={initial?.title ?? ""}
          disabled={disabled}
          className={inputCls}
        />
      </Field>

      <Field
        label="Slug"
        hint="Optional. Leave blank for keyed pages (home, contact, privacy, terms)."
      >
        <input
          name={`${locale}_slug`}
          type="text"
          defaultValue={initial?.slug ?? ""}
          disabled={disabled}
          className={inputCls}
          placeholder="e.g. about-us"
        />
      </Field>

      {usesSections ? (
        <Field
          label="Sections (JSON)"
          hint='Used for structured page layouts. Must be a valid JSON array, e.g. [{"type":"hero","heading":"..."}]. Leave blank to use Body instead.'
        >
          <textarea
            name={`${locale}_sections_json`}
            defaultValue={sectionsDefaultValue}
            disabled={disabled}
            rows={10}
            className={`${inputCls} font-mono text-xs leading-relaxed`}
            placeholder='[{"type": "hero", "heading": ""}]'
          />
        </Field>
      ) : null}

      <Field
        label="Body"
        hint={
          usesSections
            ? "Plain text or HTML body. Used if Sections is blank."
            : "Page body content (plain text or HTML)."
        }
      >
        <textarea
          name={`${locale}_body`}
          defaultValue={initial?.body ?? ""}
          disabled={disabled}
          rows={12}
          className={`${inputCls} font-mono text-xs leading-relaxed`}
        />
      </Field>

      {/* Hidden sections_json field for non-sections pages so FormData is consistent */}
      {!usesSections && (
        <input type="hidden" name={`${locale}_sections_json`} value="" />
      )}

      <SeoFields locale={locale} disabled={disabled} initial={initial} />
    </div>
  );
}
