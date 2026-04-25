import type { Metadata } from "next";
import Link from "next/link";
import { ResourceEditor } from "@/components/admin/editor/resource-editor";

export const metadata: Metadata = { title: "New resource" };

interface NewResourcePageProps {
  searchParams: Promise<{ kind?: string }>;
}

export default async function NewResourcePage({ searchParams }: NewResourcePageProps) {
  const { kind: rawKind } = await searchParams;
  const kind = rawKind === "pdf" || rawKind === "doc" || rawKind === "link" ? rawKind : "pdf";

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/resources" className="hover:text-neutral-700">
          Resources
        </Link>
        <span>/</span>
        <span className="text-neutral-600">New resource</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">New resource</h2>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {kind}
        </span>
      </div>

      <ResourceEditor kind={kind} />
    </div>
  );
}
