"use client";

import { useActionState } from "react";
import { requestPasswordResetAction } from "@/lib/actions/password-reset";
import type { ActionResult } from "@/lib/auth/with-admin";

export function ForgotPasswordForm() {
  const [state, formAction, isPending] = useActionState<
    ActionResult<{ message: string }> | null,
    FormData
  >(requestPasswordResetAction, null);

  if (state?.ok) {
    return (
      <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
        {state.data.message}
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          autoFocus
          disabled={isPending}
          placeholder="admin@example.com"
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#0B3D2E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a3527] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:opacity-50"
      >
        {isPending ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
