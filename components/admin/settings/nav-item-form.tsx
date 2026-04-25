"use client";

import { useActionState } from "react";
import { createNavItemAction, updateNavItemAction } from "@/lib/actions/settings";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminNavItem } from "@/lib/data/admin/settings";

export function NavItemForm({ item }: { item?: AdminNavItem }) {
  const isEditing = Boolean(item);
  const action = isEditing ? updateNavItemAction.bind(null, item!.id) : createNavItemAction;
  const [state, formAction, isPending] = useActionState<ActionState<{ id: number } | void>, FormData>(
    action as (
      prevState: ActionState<{ id: number } | void>,
      formData: FormData
    ) => Promise<ActionState<{ id: number } | void>>,
    null
  );

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Menu
          <select name="menu" defaultValue={item?.menu ?? "header"} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="header">Header</option>
            <option value="footer">Footer</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Link kind
          <select name="linkKind" defaultValue={item?.linkKind ?? "route"} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm">
            <option value="route">Route</option>
            <option value="external">External</option>
          </select>
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Route key
          <input name="routeKey" defaultValue={item?.routeKey ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          External URL
          <input name="externalUrl" defaultValue={item?.externalUrl ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Display order
          <input type="number" name="displayOrder" defaultValue={item?.displayOrder ?? 0} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="mt-7 inline-flex items-center gap-2 text-sm text-neutral-700">
          <input type="checkbox" name="isVisible" defaultChecked={item?.isVisible ?? true} />
          Visible
        </label>
      </div>
      {(["bn", "en", "ar"] as const).map((locale) => (
        <label key={locale} className="block text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {locale.toUpperCase()} label
          <input name={`${locale}_label`} defaultValue={item?.translations[locale].label ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
      ))}
      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <div className="flex items-center gap-3">
        <button disabled={isPending} className="rounded-md bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white">
          {isPending ? "Saving..." : isEditing ? "Update item" : "Create item"}
        </button>
      </div>
    </form>
  );
}
