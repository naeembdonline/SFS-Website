"use client";

import { useActionState } from "react";
import { useActionToast } from "@/components/admin/toast";
import {
  setUserActiveAction,
  changeUserRoleAction,
  resendInviteAction,
} from "@/lib/actions/users";
import type { ActionState } from "@/lib/auth/with-admin";
import type { AdminUserListItem } from "@/lib/data/admin/users";

// ─── ToggleActiveButton ───────────────────────────────────────────────────────

export function ToggleActiveButton({
  user,
  isSelf,
}: {
  user: AdminUserListItem;
  isSelf: boolean;
}) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    setUserActiveAction,
    null
  );
  useActionToast(state, {
    success: user.isActive ? "User deactivated." : "User reactivated.",
  });

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input
          type="hidden"
          name="isActive"
          value={user.isActive ? "false" : "true"}
        />
        <button
          type="submit"
          disabled={isPending || isSelf}
          title={isSelf ? "You cannot deactivate your own account" : undefined}
          className={
            user.isActive
              ? "rounded px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-40 transition-colors"
              : "rounded px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-40 transition-colors"
          }
        >
          {isPending ? "…" : user.isActive ? "Deactivate" : "Reactivate"}
        </button>
      </form>
      {state && !state.ok && (
        <p className="text-[11px] text-red-500">{state.error}</p>
      )}
    </div>
  );
}

// ─── ChangeRoleButton ─────────────────────────────────────────────────────────

export function ChangeRoleButton({
  user,
  isSelf,
}: {
  user: AdminUserListItem;
  isSelf: boolean;
}) {
  const nextRole = user.role === "admin" ? "editor" : "admin";
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    changeUserRoleAction,
    null
  );
  useActionToast(state, { success: "User role updated." });

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="userId" value={user.id} />
        <input type="hidden" name="role" value={nextRole} />
        <button
          type="submit"
          disabled={isPending || isSelf || !user.isActive}
          title={
            isSelf
              ? "You cannot change your own role"
              : !user.isActive
              ? "Reactivate user before changing role"
              : undefined
          }
          className="rounded px-2 py-1 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-40 transition-colors"
        >
          {isPending ? "…" : `Make ${nextRole}`}
        </button>
      </form>
      {state && !state.ok && (
        <p className="text-[11px] text-red-500">{state.error}</p>
      )}
    </div>
  );
}

// ─── ResendInviteButton ───────────────────────────────────────────────────────

export function ResendInviteButton({ user }: { user: AdminUserListItem }) {
  const [state, formAction, isPending] = useActionState<ActionState, FormData>(
    resendInviteAction,
    null
  );
  useActionToast(state, { success: "Invite resent." });

  if (!user.isActive) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <form action={formAction}>
        <input type="hidden" name="userId" value={user.id} />
        <button
          type="submit"
          disabled={isPending}
          className="rounded px-2 py-1 text-xs font-medium text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 disabled:opacity-40 transition-colors"
        >
          {isPending ? "…" : "Resend invite"}
        </button>
      </form>
      {state && !state.ok && (
        <p className="text-[11px] text-red-500">{state.error}</p>
      )}
      {state?.ok && (
        <p className="text-[11px] text-green-600">Invite sent!</p>
      )}
    </div>
  );
}
