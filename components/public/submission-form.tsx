"use client";

import { useState } from "react";
import Script from "next/script";
import type { Locale } from "@/lib/i18n/config";

export function SubmissionForm({
  kind,
  locale,
}: {
  kind: "contact" | "advisory";
  locale: Locale;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setMessage(null);

    const form = new FormData(e.currentTarget);
    const payload = {
      kind,
      locale,
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      subject: String(form.get("subject") ?? ""),
      message: String(form.get("message") ?? ""),
      honeypot: String(form.get("website") ?? ""),
      turnstileToken: String(form.get("cf-turnstile-response") ?? ""),
    };

    const res = await fetch("/api/submissions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string };

    if (!res.ok || !data.ok) {
      setMessage(data.error ?? "Could not submit. Please try again.");
      setPending(false);
      return;
    }

    e.currentTarget.reset();
    setMessage("Thank you. Your submission has been received.");
    setPending(false);
  }

  return (
    <>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-[--color-border] p-5">
        <h3 className="text-base font-semibold text-[--color-text-primary]">
          {kind === "contact" ? "Contact us" : "Advisory submission"}
        </h3>

        <label className="block text-sm font-medium text-[--color-text-primary]">
          Name
          <input
            name="name"
            type="text"
            required
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="mt-1 w-full rounded-md border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-[--color-text-primary]">
          Email
          <input
            name="email"
            type="email"
            required
            dir="ltr"
            className="mt-1 w-full rounded-md border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-[--color-text-primary]">
          Subject (optional)
          <input
            name="subject"
            type="text"
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="mt-1 w-full rounded-md border border-[--color-border] px-3 py-2"
          />
        </label>

        <label className="block text-sm font-medium text-[--color-text-primary]">
          Message
          <textarea
            name="message"
            required
            rows={5}
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="mt-1 w-full rounded-md border border-[--color-border] px-3 py-2"
          />
        </label>

        {/* Honeypot */}
        <div aria-hidden="true" className="hidden">
          <label>
            Website
            <input name="website" type="text" tabIndex={-1} autoComplete="off" />
          </label>
        </div>

        <div
          className="cf-turnstile"
          data-sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
        />

        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-[--color-brand-deep] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          {pending ? "Submitting..." : "Submit"}
        </button>

        {message && <p className="text-sm text-[--color-text-secondary]">{message}</p>}
      </form>
    </>
  );
}
