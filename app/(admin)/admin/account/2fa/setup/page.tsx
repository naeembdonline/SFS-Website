import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { generateTotpSecretAction } from "@/lib/actions/totp";
import { TotpSetupForm } from "@/components/admin/auth/totp-setup-form";

export const metadata: Metadata = {
  title: "Set up two-factor authentication",
};

export default function TotpSetupPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-50" />}>
      <TotpSetupContent />
    </Suspense>
  );
}

async function TotpSetupContent() {
  const session = await getSession();
  if (!session) redirect("/admin/login");

  // If TOTP is already enabled, send to dashboard
  if (session.user.totpEnabled) redirect("/admin");

  const result = await generateTotpSecretAction();

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]">
            Security
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Set up two-factor authentication
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            2FA is required for all admin accounts. You only need to do this
            once.
          </p>
        </div>

        {/* Card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          {result.ok ? (
            <TotpSetupForm
              secret={result.data.secret}
              qrDataUrl={result.data.qrDataUrl}
            />
          ) : (
            <p className="text-sm text-red-600">
              Failed to generate setup data. Please reload and try again.
            </p>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          Use Google Authenticator, Authy, or any RFC 6238-compatible app.
        </p>
      </div>
    </main>
  );
}
