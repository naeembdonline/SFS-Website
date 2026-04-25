import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminLeadershipList } from "@/lib/data/admin/leadership";

export const metadata: Metadata = { title: "Leadership" };

export default function LeadershipPage() {
  return (
    <Suspense fallback={null}>
      <LeadershipListContent />
    </Suspense>
  );
}

async function LeadershipListContent() {
  const members = await getAdminLeadershipList();

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Leadership</h2>
          <p className="mt-0.5 text-sm text-neutral-500">{members.length} members</p>
        </div>
        <Link href="/admin/leadership/new" className="rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3527]">
          + New member
        </Link>
      </div>
      {members.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm text-neutral-400">No members yet.</p>
          <Link
            href="/admin/leadership/new"
            className="mt-3 inline-block text-sm font-medium text-[#0B3D2E] hover:underline"
          >
            Add your first member →
          </Link>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Name (BN)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Order</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Visible</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {members.map((m) => (
              <tr key={m.id}>
                <td className="px-5 py-3.5">{m.bn.name ?? "—"}</td>
                <td className="px-4 py-3.5 text-center">{m.displayOrder}</td>
                <td className="px-4 py-3.5 text-center">{m.isVisible ? "Yes" : "No"}</td>
                <td className="px-4 py-3.5 text-end">
                  <Link href={`/admin/leadership/${m.id}`} className="text-xs font-medium text-[#0B3D2E] hover:underline">
                    Edit →
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      )}
    </div>
  );
}
