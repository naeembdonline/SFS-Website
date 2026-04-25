import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminPageList } from "@/lib/data/admin/pages";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Pages" };

const STATUS_STYLES = {
  published: "bg-green-50 text-green-700",
  draft: "bg-yellow-50 text-yellow-700",
  missing: "bg-neutral-100 text-neutral-400",
};

export default function PagesPage() {
  return (
    <Suspense fallback={null}>
      <PagesListContent />
    </Suspense>
  );
}

async function PagesListContent() {
  const pages = await getAdminPageList();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-neutral-900">Pages</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          System pages are pre-seeded. Edit translations and publish per locale.
        </p>
      </div>

      {pages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm text-neutral-400">
            No pages found. Run the database seed to create system pages.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Key
                </th>
                <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Title (BN)
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  BN
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  EN
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  AR
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {pages.map((page) => (
                <tr key={page.id} className="group hover:bg-neutral-50/50">
                  <td className="px-5 py-3.5">
                    <code className="rounded bg-neutral-100 px-1.5 py-0.5 text-xs font-mono text-neutral-600">
                      {page.key}
                    </code>
                  </td>
                  <td className="px-5 py-3.5 text-neutral-700">
                    {page.bn.title ?? (
                      <span className="italic text-neutral-400">No BN title</span>
                    )}
                  </td>
                  {(["bn", "en", "ar"] as const).map((locale) => (
                    <td key={locale} className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-medium",
                          STATUS_STYLES[page[locale].status]
                        )}
                      >
                        {page[locale].status === "missing"
                          ? "-"
                          : page[locale].status}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-end">
                    <Link
                      href={`/admin/pages/${page.id}`}
                      className="rounded px-2 py-1 text-xs font-medium text-[#0B3D2E] opacity-0 hover:underline group-hover:opacity-100"
                    >
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
