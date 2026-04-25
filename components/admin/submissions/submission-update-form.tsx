"use client";

import { useActionState } from "react";
import { updateSubmissionAction } from "@/lib/actions/submissions";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminSubmissionItem } from "@/lib/data/admin/submissions";
import { cn } from "@/lib/utils/cn";

const inputCls =
  "w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-[#0B3D2E] focus:outline-none focus:ring-2 focus:ring-[#0B3D2E]/10 disabled:opacity-50";

const STATUS_STYLES = {
  new: "bg-blue-50 text-blue-700",
  reviewed: "bg-yellow-50 text-yellow-700",
  handled: "bg-green-50 text-green-700",
  archived: "bg-neutral-100 text-neutral-500",
};

export function SubmissionUpdateForm({ item }: { item: AdminSubmissionItem }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSubmissionAction,
    null
  );

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="submissionId" value={item.id} />

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Status
        </label>
        <select
          name="status"
          defaultValue={item.status}
          disabled={isPending}
          className={cn(inputCls, "cursor-pointer")}
        >
          <option value="new">New</option>
          <option value="reviewed">Reviewed</option>
          <option value="handled">Handled</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-neutral-400">
          Admin notes
        </label>
        <textarea
          name="adminNotes"
          defaultValue={item.adminNotes ?? ""}
          rows={6}
          disabled={isPending}
          placeholder="Internal notes visible only to admins..."
          className={`${inputCls} resize-y leading-relaxed`}
        />
        <p className="mt-1 text-xs text-neutral-400">Max 2 000 characters. Never shown to the sender.</p>
      </div>

      {state && !state.ok && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-xs text-green-700">
          Saved successfully.
        </p>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-lg bg-[#0B3D2E] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#0a3527] disabled:opacity-40 transition-colors"
      >
        {isPending ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

export { STATUS_STYLES };
