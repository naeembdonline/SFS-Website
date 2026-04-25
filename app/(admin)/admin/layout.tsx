import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    template: "%s | Admin — Sovereignty",
    default: "Admin — Sovereignty",
  },
  robots: { index: false, follow: false },
};

// With cacheComponents: true, all routes are dynamic by default unless wrapped
// in 'use cache'. Admin data functions MUST NEVER use 'use cache'.
// Auth guard lives in app/(admin)/admin/(shell)/layout.tsx — NOT here,
// so that /admin/login itself is always accessible.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // LTR, English — admin is locale-agnostic (design decision)
    <div lang="en" dir="ltr" className="min-h-svh bg-neutral-50 text-neutral-900">
      {children}
    </div>
  );
}
