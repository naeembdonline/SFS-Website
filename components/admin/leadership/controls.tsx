"use client";

import { useActionState } from "react";
import { deleteLeadershipAction, toggleLeadershipVisibilityAction } from "@/lib/actions/leadership";
import type { ActionState } from "@/lib/auth/with-admin";

export function LeadershipControls({ leadershipId, isVisible }: { leadershipId: number; isVisible: boolean }) {
  const [toggleState, toggleAction, togglePending] = useActionState<ActionState, FormData>(
    toggleLeadershipVisibilityAction,
    null
  );
  const [deleteState, deleteAction, deletePending] = useActionState<ActionState, FormData>(
    deleteLeadershipAction,
    null
  );

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-4">
      <form action={toggleAction}>
        <input type="hidden" name="leadershipId" value={leadershipId} />
        <input type="hidden" name="isVisible" value={isVisible ? "false" : "true"} />
        <button type="submit" disabled={togglePending} className="w-full rounded-md bg-neutral-900 px-3 py-2 text-xs font-medium text-white">
          {isVisible ? "Hide from site" : "Show on site"}
        </button>
      </form>
      {toggleState && !toggleState.ok && <p className="text-[11px] text-red-500">{toggleState.error}</p>}

      <form
        action={deleteAction}
        onSubmit={(e) => {
          if (!confirm("Delete this leadership member?")) e.preventDefault();
        }}
      >
        <input type="hidden" name="leadershipId" value={leadershipId} />
        <button type="submit" disabled={deletePending} className="w-full rounded-md border border-red-200 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50">
          Delete member
        </button>
      </form>
      {deleteState && !deleteState.ok && <p className="text-[11px] text-red-500">{deleteState.error}</p>}
    </div>
  );
}
