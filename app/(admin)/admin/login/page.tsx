import { redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import { LoginForm } from "@/components/admin/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in",
};

interface LoginPageProps {
  searchParams: Promise<{ reset?: string }>;
}

export default function LoginPage({ searchParams }: LoginPageProps) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-50" />}>
      <LoginContent searchParams={searchParams} />
    </Suspense>
  );
}

async function LoginContent({
  searchParams,
}: {
  searchParams: Promise<{ reset?: string }>;
}) {
  const session = await getSession();
  if (session) redirect("/admin");

  const { reset } = await searchParams;
  const showResetSuccess = reset === "1";

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        {/* Logo / wordmark */}
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]">
            Sovereignty
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Admin sign in
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your credentials to access the dashboard.
          </p>
        </div>

        {/* Password-reset success banner */}
        {showResetSuccess && (
          <div className="mb-4 rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            Password reset successfully. Please sign in with your new password.
          </div>
        )}

        {/* Form card */}
        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <Suspense fallback={<div className="h-40 animate-pulse bg-neutral-50" />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-6 text-center text-xs text-neutral-400">
          <Link
            href="/admin/forgot-password"
            className="underline underline-offset-2 hover:text-neutral-600"
          >
            Forgot your password?
          </Link>
        </p>
      </div>
    </main>
  );
}
