import type { Metadata } from "next";
import Link from "next/link";
import { CampaignEditor } from "@/components/admin/editor/campaign-editor";

export const metadata: Metadata = { title: "New campaign" };

export default function NewCampaignPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/campaigns" className="hover:text-neutral-700">
          Campaigns
        </Link>
        <span>/</span>
        <span className="text-neutral-600">New campaign</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">New campaign</h2>
      </div>

      <CampaignEditor statusLifecycle="active" />
    </div>
  );
}
