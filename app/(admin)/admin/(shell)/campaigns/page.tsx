import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCampaignList, type CampaignLifecycle } from "@/lib/data/admin/campaigns";
import { cn } from "@/lib/utils/cn";

export const metadata: Metadata = { title: "Campaigns" };

const STATUS_STYLES = {
  published: "bg-green-50 text-green-700",
  draft: "bg-yellow-50 text-yellow-700",
  missing: "bg-neutral-100 text-neutral-400",
};

export default function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ lifecycle?: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <CampaignsListContent searchParams={searchParams} />
    </Suspense>
  );
}

async function CampaignsListContent({
  searchParams,
}: {
  searchParams: Promise<{ lifecycle?: string }>;
}) {
  const { lifecycle: raw } = await searchParams;
  const lifecycle: CampaignLifecycle | undefined = raw === "active" || raw === "past" ? raw : undefined;
  const campaigns = await getAdminCampaignList(lifecycle);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">Campaigns</h2>
          <p className="mt-0.5 text-sm text-neutral-500">{campaigns.length} campaigns</p>
        </div>
        <Link href="/admin/campaigns/new" className="rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3527]">
          + New campaign
        </Link>
      </div>

      <div className="mb-4 flex gap-2">
        {[
          { label: "All", href: "/admin/campaigns" },
          { label: "Active", href: "/admin/campaigns?lifecycle=active" },
          { label: "Past", href: "/admin/campaigns?lifecycle=past" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              (!lifecycle && tab.label === "All") ||
                (lifecycle === "active" && tab.label === "Active") ||
                (lifecycle === "past" && tab.label === "Past")
                ? "bg-[#0B3D2E]/8 text-[#0B3D2E]"
                : "text-neutral-500 hover:bg-neutral-100"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm text-neutral-400">No campaigns yet.</p>
          <Link
            href="/admin/campaigns/new"
            className="mt-3 inline-block text-sm font-medium text-[#0B3D2E] hover:underline"
          >
            Create your first campaign →
          </Link>
        </div>
      ) : (
      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">Title (BN)</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">Lifecycle</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">BN</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">EN</th>
              <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">AR</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {campaigns.map((campaign) => (
              <tr key={campaign.id} className="group hover:bg-neutral-50/50">
                <td className="px-5 py-3.5">{campaign.bn.title ?? <span className="italic text-neutral-400">No BN title</span>}</td>
                <td className="px-4 py-3.5 text-center">
                  <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                    {campaign.statusLifecycle}
                  </span>
                </td>
                {(["bn", "en", "ar"] as const).map((locale) => (
                  <td key={locale} className="px-4 py-3.5 text-center">
                    <span className={cn("rounded px-1.5 py-0.5 text-[11px] font-medium", STATUS_STYLES[campaign[locale].status])}>
                      {campaign[locale].status === "missing" ? "-" : campaign[locale].status}
                    </span>
                  </td>
                ))}
                <td className="px-4 py-3.5 text-end">
                  <Link href={`/admin/campaigns/${campaign.id}`} className="rounded px-2 py-1 text-xs font-medium text-[#0B3D2E] opacity-0 hover:underline group-hover:opacity-100">
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
