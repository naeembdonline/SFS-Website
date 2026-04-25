import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { getPendingTotpUserId } from "@/lib/actions/totp";
import { TotpChallengeForm } from "@/components/admin/auth/totp-challenge-form";

export const metadata: Metadata = {
  title: "Two-factor authentication",
};

export default function TotpChallengePage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-50" />}>
      <TotpChallengeContent />
    </Suspense>
  );
}

async function TotpChallengeContent() {
  // Already fully authenticated → go to dashboard
  const session = await getSession();
  if (session) redirect("/admin");

  // No pending 2FA cookie → back to login
  const userId = await getPendingTotpUserId();
  if (!userId) redirect("/admin/login");

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]">
            Sovereignty
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Two-factor authentication
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter the code from your authenticator app to continue.
          </p>
        </div>

        {/* Form card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <TotpChallengeForm />
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Lost your device?{" "}
          <span className="text-neutral-500">
            Enter a recovery code instead.
          </span>
        </p>
        <p className="mt-2 text-center text-xs text-neutral-400">
          <Link href="/admin/login" className="underline underline-offset-2 hover:text-neutral-600">
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
