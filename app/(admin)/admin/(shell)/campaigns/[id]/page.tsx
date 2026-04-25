import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCampaignById } from "@/lib/data/admin/campaigns";
import { CampaignEditor } from "@/components/admin/editor/campaign-editor";
import { CampaignPublishControls } from "@/components/admin/campaigns/publish-controls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const campaign = await getAdminCampaignById(Number(id));
  if (!campaign) return { title: "Not found" };
  const bnTitle = campaign.translations.find((t) => t.locale === "bn")?.title;
  return { title: bnTitle ? `Edit: ${bnTitle}` : "Edit campaign" };
}

export default function CampaignEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <CampaignEditContent params={params} />
    </Suspense>
  );
}

async function CampaignEditContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const campaignId = Number(rawId);
  if (isNaN(campaignId)) notFound();

  const campaign = await getAdminCampaignById(campaignId);
  if (!campaign || campaign.deletedAt) notFound();

  const bnTitle = campaign.translations.find((t) => t.locale === "bn")?.title;

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/campaigns" className="hover:text-neutral-700">
          Campaigns
        </Link>
        <span>/</span>
        <span className="text-neutral-600 line-clamp-1">{bnTitle ?? `Campaign #${campaignId}`}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">{bnTitle ?? "Edit campaign"}</h2>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {campaign.statusLifecycle}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_260px]">
        <CampaignEditor
          campaignId={campaignId}
          statusLifecycle={campaign.statusLifecycle}
          startDate={campaign.startDate}
          endDate={campaign.endDate}
          translations={campaign.translations}
        />
        <CampaignPublishControls campaignId={campaignId} translations={campaign.translations} />
      </div>
    </div>
  );
}
