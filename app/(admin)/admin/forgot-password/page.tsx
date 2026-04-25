import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { ForgotPasswordForm } from "@/components/admin/auth/forgot-password-form";

export const metadata: Metadata = {
  title: "Forgot password",
};

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-neutral-50" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

async function ForgotPasswordContent() {
  const session = await getSession();
  if (session) redirect("/admin");

  return (
    <main className="flex min-h-svh items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-[#0B3D2E]">
            Sovereignty
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
            Forgot your password?
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-8 shadow-sm">
          <ForgotPasswordForm />
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
