"use client";

/**
 * ContentEditor — 3-locale (BN / EN / AR) post editor.
 *
 * Renders a single <form> with locale-prefixed hidden + visible inputs.
 * Tab switching is purely client-side; all locale data is always in the
 * form DOM and submitted together.
 *
 * Action binding pattern (React 19 / Next.js 16):
 *   On create: <ContentEditor postId={undefined} ...>
 *   On edit:   <ContentEditor postId={42} ...> — binds updatePostAction
 */

import { useActionState, useCallback, useRef, useState } from "react";
import { createPostAction, updatePostAction } from "@/lib/actions/posts";
import type { Locale } from "@/lib/i18n/config";
import type { AdminTranslation } from "@/lib/data/admin/posts";
import type { PostType } from "@/lib/data/public/posts";
import type { ActionState } from "@/lib/auth/with-admin";
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

interface ContentEditorProps {
  postId?: number;
  type?: PostType;
  translations?: AdminTranslation[];
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ContentEditor({ postId, type, translations }: ContentEditorProps) {
  const isEditing = Boolean(postId);

  // Bind the correct action
  const action = isEditing
    ? updatePostAction.bind(null, postId!)
    : createPostAction;

  const [state, formAction, isPending] = useActionState<
    ActionState<{ id: number } | void>,
    FormData
  >(
    action as (
      prevState: ActionState<{ id: number } | void>,
      formData: FormData
    ) => Promise<ActionState<{ id: number } | void>>,
    null
  );

  // Build per-locale status map for the tab indicators
  const statuses: Record<Locale, LocaleStatus> = {
    bn: "missing",
    en: "missing",
    ar: "missing",
  };
  if (translations) {
    for (const t of translations) {
      if (t.locale === "bn" || t.locale === "en" || t.locale === "ar") {
        statuses[t.locale] = t.status === "published" ? "published"
          : t.title ? "draft"
          : "missing";
      }
    }
  }

  // Initial values map
  const initial = new Map<string, AdminTranslation>();
  if (translations) {
    for (const t of translations) initial.set(t.locale, t);
  }

  return (
    <EditorShell
      formAction={formAction}
      isEditing={isEditing}
      isPending={isPending}
      state={state}
      createLabel="Create post"
      editLabel="Save changes"
      createHint="New post will be saved as draft"
      editHint="Changes are saved as draft"
      enableAutosave
      topSection={!isEditing ? <input type="hidden" name="type" value={type ?? "blog"} /> : undefined}
    >
      <LocaleEditorTabs
        statuses={statuses}
        renderPanel={(locale) => (
          <LocalePanel
            locale={locale}
            initial={initial.get(locale)}
            disabled={isPending}
          />
        )}
      />
    </EditorShell>
  );
}

// ─── LocalePanel ─────────────────────────────────────────────────────────────

interface LocalePanelProps {
  locale: Locale;
  initial?: AdminTranslation;
  disabled?: boolean;
}

function LocalePanel({ locale, initial, disabled }: LocalePanelProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const slugManuallyEdited = useRef(Boolean(initial?.slug));

  const handleTitleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newTitle = e.target.value;
      setTitle(newTitle);
      if (!slugManuallyEdited.current) {
        setSlug(slugify(newTitle));
      }
    },
    []
  );

  const handleSlugChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      slugManuallyEdited.current = true;
      setSlug(e.target.value);
    },
    []
  );

  return (
    <div className="space-y-6 px-6 pb-8">
      {/* Title */}
      <Field label="Title" required>
        <input
          name={`${locale}_title`}
          type="text"
          value={title}
          onChange={handleTitleChange}
          disabled={disabled}
          placeholder="Enter title…"
          className={inputCls}
        />
      </Field>

      {/* Slug */}
      <Field
        label="Slug"
        required
        hint="URL-safe identifier. Auto-generated from title."
      >
        <div className="flex items-center rounded-md border border-neutral-300 bg-white focus-within:border-[#0B3D2E] focus-within:ring-2 focus-within:ring-[#0B3D2E]/20">
          <span className="select-none border-e border-neutral-200 px-3 py-2 text-xs text-neutral-400">
            /{locale}/
          </span>
          <input
            name={`${locale}_slug`}
            type="text"
            value={slug}
            onChange={handleSlugChange}
            disabled={disabled}
            placeholder="my-post-slug"
            className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-neutral-900 focus:outline-none"
          />
        </div>
      </Field>

      {/* Excerpt */}
      <Field label="Excerpt" hint="Short summary shown in list views (optional)">
        <textarea
          name={`${locale}_excerpt`}
          defaultValue={initial?.excerpt ?? ""}
          disabled={disabled}
          rows={2}
          placeholder="Brief summary…"
          className={inputCls}
        />
      </Field>

      {/* Body */}
      <Field label="Body" required>
        <textarea
          name={`${locale}_body`}
          defaultValue={initial?.body ?? ""}
          disabled={disabled}
          rows={12}
          placeholder="Write your content here… (HTML supported)"
          className={cn(inputCls, "font-mono text-xs leading-relaxed")}
        />
      </Field>

      <SeoFields locale={locale} disabled={disabled} initial={initial} />
    </div>
  );
}
