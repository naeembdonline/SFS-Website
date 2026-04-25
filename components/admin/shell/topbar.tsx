"use client";

import { useActionState } from "react";
import { ExternalLink, LogOut } from "lucide-react";
import { logoutAction } from "@/lib/actions/auth";
import type { SessionUser } from "@/lib/auth/session";

interface TopbarProps {
  user: SessionUser;
  title?: string;
}

export function Topbar({ user, title }: TopbarProps) {
  const [, formAction, isPending] = useActionState(async () => {
    await logoutAction();
    return null;
  }, null);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-neutral-200 bg-white/95 px-8 font-sans shadow-sm shadow-neutral-900/5 backdrop-blur-sm">
      {/* Page title */}
      <div>
        <h1 className="text-sm font-semibold text-neutral-900">
          {title ?? "Admin"}
        </h1>
        <p className="text-xs text-neutral-400">Operational command center</p>
      </div>

      {/* Right: user + logout */}
      <div className="flex items-center gap-4">
        {/* View site */}
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden items-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition-all duration-200 hover:border-[#0B3D2E]/20 hover:bg-neutral-50 hover:text-[#0B3D2E] sm:flex"
        >
          View site
          <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
        </a>

        {/* User info */}
        <div className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B3D2E] text-sm font-semibold text-white shadow-sm ring-2 ring-[#D4AF37]/30">
            {(user.displayName ?? user.email)[0].toUpperCase()}
          </div>
          <span className="hidden flex-col sm:flex">
            <span className="text-xs font-semibold text-neutral-900">
              {user.displayName ?? user.email.split("@")[0]}
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-[#0B3D2E]">
              {user.role}
            </span>
          </span>
        </div>

        {/* Logout */}
        <form action={formAction}>
          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-2 text-xs font-semibold text-red-700 shadow-sm transition-all duration-200 hover:border-red-200 hover:bg-red-100 disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
            {isPending ? "Signing out" : "Sign out"}
          </button>
        </form>
      </div>
    </header>
  );
}
