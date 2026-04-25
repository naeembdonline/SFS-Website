import { Suspense } from "react";
import type { Metadata } from "next";
import { getAdminSubmissions } from "@/lib/data/admin/submissions";
import { SubmissionRowForm } from "@/components/admin/submissions/submission-row-form";

export const metadata: Metadata = { title: "Submissions" };

const IP_RETENTION_DAYS = 90;

function isIpExpired(createdAt: Date): boolean {
  const ageMs = Date.now() - createdAt.getTime();
  return ageMs > IP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
}

export default function AdminSubmissionsPage() {
  return (
    <Suspense fallback={null}>
      <SubmissionsListContent />
    </Suspense>
  );
}

async function SubmissionsListContent() {
  const submissions = await getAdminSubmissions();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Submissions</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Contact and advisory submissions with status management.
        </p>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">ID</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Sender</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Kind</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Message</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Meta</th>
              <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Manage</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {submissions.map((item) => {
              const ipDisplay = isIpExpired(item.createdAt)
                ? "redacted (retention expired)"
                : item.ip ?? "not stored";
              return (
                <SubmissionRowForm
                  key={item.id}
                  item={item}
                  ipDisplay={ipDisplay}
                  detailHref={`/admin/submissions/${item.id}`}
                />
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
