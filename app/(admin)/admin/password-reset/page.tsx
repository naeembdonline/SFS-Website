import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ResetPasswordForm } from "@/components/admin/auth/reset-password-form";

export const metadata: Metadata = {
  title: "Reset password",
};

interface PasswordResetPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default function PasswordResetPage({ searchParams }: PasswordResetPageProps) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-50" />}>
      <PasswordResetContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PasswordResetContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/admin");

  const { token } = await searchParams;

  // Token must be a 64-char hex string — basic guard before hitting the DB
  const isValidShape = typeof token === "string" && /^[a-f0-9]{64}$/.test(token);

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]">
            Sovereignty
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Set a new password
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Choose a strong password of at least 12 characters.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          {isValidShape ? (
            <ResetPasswordForm token={token!} />
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-600">
                This reset link is invalid or missing. Please request a new one.
              </p>
              <Link
                href="/admin/forgot-password"
                className="block w-full rounded-md bg-[#0B3D2E] px-4 py-2.5 text-center text-sm font-medium text-white hover:bg-[#0a3527]"
              >
                Request a new reset link
              </Link>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link
            href="/admin/login"
            className="underline underline-offset-2 hover:text-neutral-600"
          >
            ← Back to sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
