"use client";

import { useActionState } from "react";
import Link from "next/link";
import { updateSubmissionAction } from "@/lib/actions/submissions";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminSubmissionItem } from "@/lib/data/admin/submissions";

export function SubmissionRowForm({
  item,
  ipDisplay,
  detailHref,
}: {
  item: AdminSubmissionItem;
  ipDisplay: string;
  detailHref?: string;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    updateSubmissionAction,
    null
  );

  return (
    <tr className="align-top">
      <td className="px-4 py-3 text-xs text-neutral-500">#{item.id}</td>
      <td className="px-4 py-3 text-sm">
        <div className="font-medium text-neutral-900">{item.name}</div>
        <div className="text-xs text-neutral-500">{item.email}</div>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-600">
        <div className="rounded bg-neutral-100 px-2 py-0.5 inline-block uppercase">{item.kind}</div>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-600 max-w-[260px]">
        <div className="font-medium">{item.subject ?? "No subject"}</div>
        <p className="mt-1 line-clamp-4 whitespace-pre-wrap">{item.message}</p>
      </td>
      <td className="px-4 py-3 text-xs text-neutral-600">
        <div>{item.locale ?? "—"}</div>
        <div>{item.createdAt.toLocaleString()}</div>
        <div className="mt-1">IP: {ipDisplay}</div>
      </td>
      <td className="px-4 py-3">
        <form action={formAction} className="space-y-2">
          <input type="hidden" name="submissionId" value={item.id} />
          <select
            name="status"
            defaultValue={item.status}
            disabled={isPending}
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs"
          >
            <option value="new">new</option>
            <option value="reviewed">reviewed</option>
            <option value="handled">handled</option>
            <option value="archived">archived</option>
          </select>
          <textarea
            name="adminNotes"
            defaultValue={item.adminNotes ?? ""}
            rows={3}
            disabled={isPending}
            placeholder="Admin notes..."
            className="w-full rounded border border-neutral-300 px-2 py-1 text-xs"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded bg-[#0B3D2E] px-2.5 py-1 text-xs font-medium text-white disabled:opacity-60"
          >
            {isPending ? "Saving..." : "Save"}
          </button>
          {state && !state.ok && (
            <p className="text-[11px] text-red-500">{state.error}</p>
          )}
        </form>
      </td>
      <td className="px-4 py-3 text-end align-top">
        {detailHref && (
          <Link
            href={detailHref}
            className="text-xs font-medium text-[#0B3D2E] hover:underline"
          >
            View →
          </Link>
        )}
      </td>
    </tr>
  );
}
