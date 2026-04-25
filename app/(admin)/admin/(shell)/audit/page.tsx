import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuditTable } from "@/components/admin/audit/audit-table";
import { getAdminAuditLogs } from "@/lib/data/admin/audit";

export const metadata: Metadata = { title: "Audit Log" };

const PAGE_SIZE = 50;

interface AuditPageProps {
  searchParams: Promise<{ page?: string }>;
}

export default function AuditPage({ searchParams }: AuditPageProps) {
  return (
    <Suspense fallback={null}>
      <AuditPageContent searchParams={searchParams} />
    </Suspense>
  );
}

async function AuditPageContent({ searchParams }: AuditPageProps) {
  const { page: rawPage } = await searchParams;
  const page = Math.max(1, Number.parseInt(rawPage ?? "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const rows = await getAdminAuditLogs(PAGE_SIZE + 1, offset);
  const logs = rows.slice(0, PAGE_SIZE);
  const hasNextPage = rows.length > PAGE_SIZE;

  return (
    <div>
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Audit Log</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            Immutable action history for administrative changes.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Link
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page === 1}
            className={
              page === 1
                ? "pointer-events-none rounded-md border border-neutral-200 px-3 py-2 text-neutral-300"
                : "rounded-md border border-neutral-200 px-3 py-2 text-neutral-600 hover:bg-neutral-50"
            }
          >
            Previous
          </Link>
          <span className="rounded-md bg-neutral-100 px-3 py-2 text-neutral-500">
            Page {page}
          </span>
          <Link
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={!hasNextPage}
            className={
              hasNextPage
                ? "rounded-md border border-neutral-200 px-3 py-2 text-neutral-600 hover:bg-neutral-50"
                : "pointer-events-none rounded-md border border-neutral-200 px-3 py-2 text-neutral-300"
            }
          >
            Next
          </Link>
        </div>
      </div>

      <AuditTable logs={logs} />
    </div>
  );
}
