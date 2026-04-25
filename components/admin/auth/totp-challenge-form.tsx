"use client";

import { useActionState } from "react";
import { verifyTotpChallengeAction } from "@/lib/actions/totp";
import type { ActionResult } from "@/lib/auth/with-admin";

export function TotpChallengeForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult<void> | null,
    FormData
  >(verifyTotpChallengeAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="code"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Authenticator code
        </label>
        <input
          id="code"
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={20}
          required
          autoFocus
          disabled={isPending}
          placeholder="000000"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-center text-lg font-mono tracking-widest text-neutral-900 placeholder:text-neutral-300 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 disabled:opacity-60"
        />
        <p className="mt-1.5 text-xs text-neutral-400">
          Enter the 6-digit code from your authenticator app, or paste a
          recovery code (format: XXXXX-XXXXX).
        </p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#0B3D2E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a3527] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:opacity-50"
      >
        {isPending ? "Verifying…" : "Verify"}
      </button>
    </form>
  );
}
