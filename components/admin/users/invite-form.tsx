"use client";

import { useActionState, useState } from "react";
import { useActionToast } from "@/components/admin/toast";
import { inviteUserAction } from "@/lib/actions/users";
import type { ActionState } from "@/lib/auth/with-admin";
import { cn } from "@/lib/utils/cn";

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10 disabled:opacity-50";

export function InviteUserForm() {
  const [state, formAction, isPending] = useActionState<
    ActionState<{ userId: number }>,
    FormData
  >(inviteUserAction, null);

  const [open, setOpen] = useState(false);
  useActionToast(state, { success: "Invite sent." });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3527] transition-colors"
      >
        + Invite user
      </button>
    );
  }

  const success = state?.ok && state.data?.userId;

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">Invite new user</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-neutral-400 hover:text-neutral-600 text-sm"
        >
          ✕
        </button>
      </div>

      {success ? (
        <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">
          Invite sent! The user will receive an email to set up their account.
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="ml-3 font-medium underline"
          >
            Close
          </button>
        </div>
      ) : (
        <form action={formAction} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                autoComplete="off"
                disabled={isPending}
                className={inputCls}
                placeholder="editor@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-700">
                Display name <span className="text-red-500">*</span>
              </label>
              <input
                name="displayName"
                type="text"
                required
                disabled={isPending}
                className={inputCls}
                placeholder="Full name"
              />
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-700">
              Role <span className="text-red-500">*</span>
            </label>
            <select
              name="role"
              defaultValue="editor"
              disabled={isPending}
              className={cn(inputCls, "cursor-pointer")}
            >
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
            </select>
          </div>

          {state && !state.ok && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {state.error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3527] disabled:opacity-40 transition-colors"
            >
              {isPending ? "Sending invite…" : "Send invite"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="rounded-lg px-4 py-2 text-sm font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
