/**
 * Shell layout — wraps all authenticated admin pages.
 *
 * Responsibilities:
 * 1. Auth guard: read session, redirect to /admin/login if absent
 * 2. Render Sidebar (server-passes role) + Topbar (user info)
 * 3. Offset main content area for the fixed sidebar
 *
 * /admin/login is outside this group and therefore never guarded.
 */

import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/admin/shell/sidebar";
import { Topbar } from "@/components/admin/shell/topbar";
import { ToastProvider } from "@/components/admin/toast";

const bypassTotpInDevelopment = process.env.NODE_ENV === "development";

export default function AdminShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-50" />}>
      <AdminShellContent>{children}</AdminShellContent>
    </Suspense>
  );
}

async function AdminShellContent({ children }: { children: React.ReactNode }) {
  // Auth guard — server-side, runs on every shell route request
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  // TOTP enforcement — all admin users must have 2FA enrolled.
  // The setup page lives outside this route group so this redirect is safe.
  if (!bypassTotpInDevelopment && !session.user.totpEnabled) {
    redirect("/admin/account/2fa/setup");
  }

  return (
    <div className="flex min-h-svh">
      {/* Fixed sidebar */}
      <Suspense fallback={<aside className="fixed inset-y-0 start-0 z-30 w-72 border-e border-[#06281E] bg-[#0B3D2E]" />}>
        <Sidebar role={session.user.role} />
      </Suspense>

      {/* Main content: offset by sidebar width (w-72 = 18rem) */}
      <div className="flex min-h-svh flex-1 flex-col bg-neutral-50 ps-72 font-sans">
        <Suspense fallback={<header className="sticky top-0 z-20 h-14 border-b border-neutral-200 bg-white" />}>
          <Topbar user={session.user} />
        </Suspense>
        <ToastProvider>
          <main className="flex-1 p-8">{children}</main>
        </ToastProvider>
      </div>
    </div>
  );
}
