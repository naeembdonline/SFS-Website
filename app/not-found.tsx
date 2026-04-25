import Link from "next/link";
import { defaultLocale } from "@/lib/i18n/config";

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 bg-[--color-brand-black] px-4 text-center">
      <p className="text-5xl font-bold text-white">404</p>
      <p className="text-base text-white/60">Page not found.</p>
      <Link
        href={`/${defaultLocale}`}
        className="mt-2 rounded-md border border-white/20 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/10"
      >
        Go home
      </Link>
    </main>
  );
}
