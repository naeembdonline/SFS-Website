"use client";

import { useActionState } from "react";
import { createLeadershipAction, updateLeadershipAction } from "@/lib/actions/leadership";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminLeadershipTranslation } from "@/lib/data/admin/leadership";
import { EditorShell, LocaleEditorTabs, Field, inputCls, type LocaleStatus } from "./base-editor";
import type { Locale } from "@/lib/i18n/config";

export function LeadershipEditor({
  leadershipId,
  displayOrder,
  isVisible,
  photoMediaId,
  translations,
}: {
  leadershipId?: number;
  displayOrder?: number;
  isVisible?: boolean;
  photoMediaId?: number | null;
  translations?: AdminLeadershipTranslation[];
}) {
  const isEditing = Boolean(leadershipId);
  const action = isEditing ? updateLeadershipAction.bind(null, leadershipId!) : createLeadershipAction;
  const [state, formAction, isPending] = useActionState<ActionState<{ id: number } | void>, FormData>(
    action as (
      prevState: ActionState<{ id: number } | void>,
      formData: FormData
    ) => Promise<ActionState<{ id: number } | void>>,
    null
  );

  const initial = new Map<string, AdminLeadershipTranslation>();
  for (const t of translations ?? []) initial.set(t.locale, t);

  const statuses: Record<Locale, LocaleStatus> = {
    bn: initial.get("bn")?.name ? "draft" : "missing",
    en: initial.get("en")?.name ? "draft" : "missing",
    ar: initial.get("ar")?.name ? "draft" : "missing",
  };

  return (
    <EditorShell
      formAction={formAction}
      isEditing={isEditing}
      isPending={isPending}
      state={state}
      createLabel="Create member"
      editLabel="Save changes"
      createHint="New leadership member will be created"
      editHint="Changes are saved immediately"
      topSection={(
        <div className="grid grid-cols-1 gap-4 rounded-xl border border-neutral-200 bg-white p-5 md:grid-cols-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Display order
            <input type="number" min={0} name="displayOrder" defaultValue={displayOrder ?? 0} disabled={isPending} className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
            Photo media ID
            <input type="number" min={1} name="photoMediaId" defaultValue={photoMediaId ?? ""} disabled={isPending} className="mt-1.5 w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900" />
          </label>
          <label className="mt-6 inline-flex items-center gap-2 text-sm text-neutral-700">
            <input type="checkbox" name="isVisible" value="true" defaultChecked={isVisible ?? true} />
            Visible on public site
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
  initial?: AdminLeadershipTranslation;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-6 px-6 pb-8">
      <Field label="Name" required>
        <input name={`${locale}_name`} type="text" defaultValue={initial?.name ?? ""} disabled={disabled} className={inputCls} />
      </Field>
      <Field label="Role title">
        <input name={`${locale}_role_title`} type="text" defaultValue={initial?.roleTitle ?? ""} disabled={disabled} className={inputCls} />
      </Field>
      <Field label="Bio">
        <textarea name={`${locale}_bio`} defaultValue={initial?.bio ?? ""} disabled={disabled} rows={6} className={inputCls} />
      </Field>
    </div>
  );
}
