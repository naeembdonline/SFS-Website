"use client";

import Link from "next/link";
import { useActionState } from "react";
import { enableTotpAction } from "@/lib/actions/totp";
import type { EnableTotpData } from "@/lib/actions/totp";
import type { ActionResult } from "@/lib/auth/with-admin";

interface TotpSetupFormProps {
  /** Base32 secret — passed as hidden field and shown for manual entry */
  secret: string;
  /** QR code as data URL */
  qrDataUrl: string;
}

export function TotpSetupForm({ secret, qrDataUrl }: TotpSetupFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult<EnableTotpData> | null,
    FormData
  >(enableTotpAction, null);

  // After successful enrollment, show recovery codes
  if (state?.ok) {
    return (
      <div className="space-y-6">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">
            Two-factor authentication is now enabled.
          </p>
        </div>

        <div>
          <h2 className="mb-2 text-sm font-semibold text-neutral-700">
            Save your recovery codes
          </h2>
          <p className="mb-4 text-sm text-neutral-500">
            Store these somewhere safe. Each code can be used once to sign in
            if you lose access to your authenticator app.
          </p>
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-neutral-200 bg-neutral-50 p-4">
            {state.data.recoveryCodes.map((code) => (
              <code
                key={code}
                className="rounded bg-white px-3 py-1.5 text-center font-mono text-sm tracking-wider text-neutral-800 shadow-sm"
              >
                {code}
              </code>
            ))}
          </div>
        </div>

        <Link
          href="/admin"
          className="block w-full rounded-md bg-[#0B3D2E] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[#0a3527] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40"
        >
          Continue to dashboard →
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-6">
      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* QR code */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-sm text-neutral-500">
          Scan with Google Authenticator, Authy, or any TOTP app.
        </p>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrDataUrl}
          alt="TOTP QR code"
          width={200}
          height={200}
          className="rounded-lg border border-neutral-200"
        />
      </div>

      {/* Manual entry */}
      <details className="group">
        <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-600">
          Can&apos;t scan? Enter code manually
        </summary>
        <div className="mt-2 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2">
          <code className="break-all font-mono text-xs text-neutral-700">
            {secret}
          </code>
        </div>
      </details>

      {/* Hidden secret passed to action */}
      <input type="hidden" name="secret" value={secret} />

      {/* Verification code */}
      <div>
        <label
          htmlFor="code"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Verification code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={6}
          required
          pattern="\d{6}"
          autoFocus
          disabled={isPending}
          placeholder="000000"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-lg font-mono tracking-widest text-neutral-900 placeholder:text-neutral-300 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-neutral-400">
          Enter the 6-digit code shown in your authenticator app to confirm setup.
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#0B3D2E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a3527] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:opacity-50"
      >
        {isPending ? "Activating…" : "Activate two-factor authentication"}
      </button>
    </form>
  );
}
