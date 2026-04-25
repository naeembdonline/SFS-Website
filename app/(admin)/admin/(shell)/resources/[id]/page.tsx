import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminResourceById } from "@/lib/data/admin/resources";
import { ResourceEditor } from "@/components/admin/editor/resource-editor";
import { ResourcePublishControls } from "@/components/admin/resources/publish-controls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const resource = await getAdminResourceById(Number(id));
  if (!resource) return { title: "Not found" };
  const bnTitle = resource.translations.find((t) => t.locale === "bn")?.title;
  return { title: bnTitle ? `Edit: ${bnTitle}` : "Edit resource" };
}

export default function ResourceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <ResourceEditContent params={params} />
    </Suspense>
  );
}

async function ResourceEditContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const resourceId = Number(rawId);
  if (isNaN(resourceId)) notFound();

  const resource = await getAdminResourceById(resourceId);
  if (!resource || resource.deletedAt) notFound();

  const bnTitle = resource.translations.find((t) => t.locale === "bn")?.title;

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/resources" className="hover:text-neutral-700">
          Resources
        </Link>
        <span>/</span>
        <span className="text-neutral-600 line-clamp-1">{bnTitle ?? `Resource #${resourceId}`}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">{bnTitle ?? "Edit resource"}</h2>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {resource.kind}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_260px]">
        <ResourceEditor
          resourceId={resourceId}
          kind={resource.kind}
          fileMediaId={resource.fileMediaId}
          externalUrl={resource.externalUrl}
          translations={resource.translations}
        />
        <ResourcePublishControls resourceId={resourceId} translations={resource.translations} />
      </div>
    </div>
  );
}
