"use client";

import { useActionState } from "react";
import { updateSiteSettingsAction } from "@/lib/actions/settings";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminSiteSettings } from "@/lib/data/admin/settings";

export function SiteSettingsForm({ settings }: { settings: AdminSiteSettings | null }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSiteSettingsAction,
    null
  );
  const initial = settings ?? {
    contactEmail: null,
    contactPhone: null,
    address: null,
    logoMediaId: null,
    defaultOgImageId: null,
    socials: [],
    translations: {
      bn: { siteName: "", tagline: null, footerText: null, defaultMetaDescription: null },
      en: { siteName: "", tagline: null, footerText: null, defaultMetaDescription: null },
      ar: { siteName: "", tagline: null, footerText: null, defaultMetaDescription: null },
    },
  };

  return (
    <form action={formAction} className="space-y-4 rounded-xl border border-neutral-200 bg-white p-5">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Contact email
          <input name="contactEmail" defaultValue={initial.contactEmail ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Contact phone
          <input name="contactPhone" defaultValue={initial.contactPhone ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Address
        <textarea name="address" defaultValue={initial.address ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
      </label>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Logo media ID
          <input type="number" min={1} name="logoMediaId" defaultValue={initial.logoMediaId ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
        <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
          Default OG image ID
          <input type="number" min={1} name="defaultOgImageId" defaultValue={initial.defaultOgImageId ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
        </label>
      </div>
      <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
        Socials JSON
        <textarea
          name="socials_json"
          defaultValue={JSON.stringify(initial.socials, null, 2)}
          rows={4}
          className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 font-mono text-xs"
        />
      </label>

      {(["bn", "en", "ar"] as const).map((locale) => (
        <fieldset key={locale} className="rounded-md border border-neutral-200 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-neutral-500">{locale.toUpperCase()}</legend>
          <div className="space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Site name
              <input name={`${locale}_site_name`} defaultValue={initial.translations[locale].siteName ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Tagline
              <input name={`${locale}_tagline`} defaultValue={initial.translations[locale].tagline ?? ""} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Footer text
              <textarea name={`${locale}_footer_text`} defaultValue={initial.translations[locale].footerText ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
              Default meta description
              <textarea name={`${locale}_default_meta_description`} defaultValue={initial.translations[locale].defaultMetaDescription ?? ""} rows={2} className="mt-1.5 w-full rounded-md border border-neutral-300 px-3 py-2 text-sm" />
            </label>
          </div>
        </fieldset>
      ))}

      {state && !state.ok && <p className="text-sm text-red-600">{state.error}</p>}
      <button disabled={isPending} className="rounded-md bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white">
        {isPending ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
