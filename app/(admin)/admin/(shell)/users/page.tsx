import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { getAdminUserList } from "@/lib/data/admin/users";
import { InviteUserForm } from "@/components/admin/users/invite-form";
import {
  ToggleActiveButton,
  ChangeRoleButton,
  ResendInviteButton,
} from "@/components/admin/users/user-actions";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Users" };

export default function UsersPage() {
  return (
    <Suspense fallback={null}>
      <UsersListContent />
    </Suspense>
  );
}

async function UsersListContent() {
  const [users, session] = await Promise.all([
    getAdminUserList(),
    getSession(),
  ]);

  const currentUserId = session?.user.id;
  const isAdmin = session?.user.role === "admin";

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Users</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Manage admin accounts. All actions are audit-logged.
          </p>
        </div>
        {isAdmin && <InviteUserForm />}
      </div>

      {users.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm text-neutral-400">No users found.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  User
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Role
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Status
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  2FA
                </th>
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Last login
                </th>
                {isAdmin && (
                  <th className="px-4 py-3 text-end text-xs font-semibold uppercase tracking-wider text-neutral-400">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {users.map((user) => {
                const isSelf = user.id === currentUserId;
                return (
                  <tr
                    key={user.id}
                    className={cn(
                      "group",
                      !user.isActive && "opacity-60",
                      "hover:bg-neutral-50/50"
                    )}
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex flex-col">
                        <span className="font-medium text-neutral-900">
                          {user.displayName ?? (
                            <span className="italic text-neutral-400">
                              No name
                            </span>
                          )}
                          {isSelf && (
                            <span className="ml-2 rounded bg-[#0B3D2E]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#0B3D2E]">
                              you
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-neutral-400">
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          user.role === "admin"
                            ? "bg-purple-50 text-purple-700"
                            : "bg-blue-50 text-blue-700"
                        )}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          user.isActive
                            ? "bg-green-50 text-green-700"
                            : "bg-neutral-100 text-neutral-400"
                        )}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={cn(
                          "rounded px-2 py-0.5 text-xs font-medium",
                          user.totpEnabled
                            ? "bg-green-50 text-green-700"
                            : "bg-yellow-50 text-yellow-600"
                        )}
                      >
                        {user.totpEnabled ? "Enabled" : "Not set"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-neutral-400">
                      {user.lastLoginAt
                        ? new Date(user.lastLoginAt).toLocaleDateString(
                            "en-GB",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }
                          )
                        : "Never"}
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <ChangeRoleButton user={user} isSelf={isSelf} />
                          <ToggleActiveButton user={user} isSelf={isSelf} />
                          {!user.lastLoginAt && (
                            <ResendInviteButton user={user} />
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
