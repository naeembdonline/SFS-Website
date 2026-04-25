"use client";

import { useActionState } from "react";
import { regenerateRecoveryCodesAction } from "@/lib/actions/totp";
import type { ActionResult } from "@/lib/auth/with-admin";
import type { RecoveryCodeStatus, RegenerateCodesData } from "@/lib/actions/totp";

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-300 font-mono tracking-widest text-center focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10 disabled:opacity-50";

export function RecoveryCodesPanel({
  initialStatus,
}: {
  initialStatus: RecoveryCodeStatus;
}) {
  const [state, formAction, isPending] = useActionState<
    ActionResult<RegenerateCodesData> | null,
    FormData
  >(regenerateRecoveryCodesAction, null);

  // After successful regeneration, show the new codes
  if (state?.ok) {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-sm font-semibold text-emerald-800">
            New recovery codes generated.
          </p>
          <p className="mt-0.5 text-xs text-emerald-700">
            Your old codes have been invalidated. Save these now — they will not
            be shown again.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          {state.data.recoveryCodes.map((code) => (
            <code
              key={code}
              className="rounded bg-white px-3 py-2 text-center font-mono text-sm tracking-wider text-neutral-800 shadow-sm select-all"
            >
              {code}
            </code>
          ))}
        </div>

        <p className="text-xs text-neutral-400">
          Store these in a password manager or printed in a secure location.
          Each code can be used once.
        </p>
      </div>
    );
  }

  const { remaining, total } = initialStatus;
  const pct = total > 0 ? Math.round((remaining / total) * 100) : 0;
  const isLow = remaining <= 2;

  return (
    <div className="space-y-5">
      {/* Status indicator */}
      <div
        className={
          isLow
            ? "rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3"
            : "rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3"
        }
      >
        <p className={`text-sm font-medium ${isLow ? "text-yellow-800" : "text-neutral-700"}`}>
          {remaining} of {total} recovery codes remaining
        </p>
        {isLow && (
          <p className="mt-0.5 text-xs text-yellow-700">
            You are running low. Regenerate now to get a fresh set of 8 codes.
          </p>
        )}
        {/* Progress bar */}
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
          <div
            className={`h-full rounded-full transition-all ${isLow ? "bg-yellow-400" : "bg-[#0B3D2E]"}`}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <p className="text-sm text-neutral-600">
        Recovery codes let you sign in if you lose access to your authenticator
        app. Regenerating will invalidate all existing codes — confirm with your
        current TOTP code below.
      </p>

      <form action={formAction} className="space-y-4">
        <div>
          <label
            htmlFor="regen-code"
            className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-500"
          >
            Current TOTP code
          </label>
          <input
            id="regen-code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            required
            pattern="\d{6}"
            disabled={isPending}
            placeholder="000000"
            className={inputCls}
          />
        </div>

        {state && !state.ok && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
            {state.error}
          </p>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-40 transition-colors"
        >
          {isPending ? "Regenerating…" : "Regenerate recovery codes"}
        </button>
      </form>
    </div>
  );
}
