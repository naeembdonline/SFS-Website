import Link from "next/link";

export default function AdminNotFound() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-neutral-50 px-4">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-neutral-400">
          404
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-neutral-900">
          Page not found
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          This page does not exist in the admin panel.
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-block rounded-lg bg-[#0B3D2E] px-5 py-2 text-sm font-medium text-white hover:bg-[#0a3527]"
        >
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
