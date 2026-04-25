"use client";

import { useActionState } from "react";
import { resetPasswordAction } from "@/lib/actions/password-reset";
import type { ActionResult } from "@/lib/auth/with-admin";

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [state, formAction, isPending] = useActionState<
    ActionResult<void> | null,
    FormData
  >(resetPasswordAction, null);

  return (
    <form action={formAction} className="space-y-4">
      {state && !state.ok && (
        <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Raw token passed as hidden field */}
      <input type="hidden" name="token" value={token} />

      <div>
        <label
          htmlFor="password"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          autoFocus
          disabled={isPending}
          minLength={12}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 disabled:opacity-60"
        />
        <p className="mt-1 text-xs text-neutral-400">Minimum 12 characters.</p>
      </div>

      <div>
        <label
          htmlFor="confirmPassword"
          className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-500"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          disabled={isPending}
          minLength={12}
          className="w-full rounded-md border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/20 disabled:opacity-60"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-[#0B3D2E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a3527] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/40 disabled:opacity-50"
      >
        {isPending ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
