import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getRecoveryCodeStatusAction } from "@/lib/actions/totp";
import { RecoveryCodesPanel } from "@/components/admin/auth/recovery-codes-panel";

export const metadata: Metadata = {
  title: "Recovery codes",
};

export default function RecoveryCodesPage() {
  return (
    <Suspense fallback={null}>
      <RecoveryCodesContent />
    </Suspense>
  );
}

async function RecoveryCodesContent() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  if (!session.user.totpEnabled) redirect("/admin/account/2fa/setup");

  const result = await getRecoveryCodeStatusAction();

  return (
    <div className="mx-auto max-w-lg">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin" className="hover:text-neutral-700">
          Dashboard
        </Link>
        <span>/</span>
        <span className="text-neutral-600">Recovery codes</span>
      </nav>

      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">
          Recovery codes
        </h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Manage your two-factor authentication backup codes.
        </p>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-6">
        {result.ok ? (
          <RecoveryCodesPanel initialStatus={result.data} />
        ) : (
          <p className="text-sm text-red-600">
            Failed to load recovery code status. Please reload and try again.
          </p>
        )}
      </div>

      <p className="mt-4 text-center text-xs text-neutral-400">
        Recovery codes are hashed and stored securely. Raw codes are only shown
        once — at setup or after regeneration.
      </p>
    </div>
  );
}
