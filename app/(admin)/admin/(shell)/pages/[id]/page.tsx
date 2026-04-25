import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminPageById } from "@/lib/data/admin/pages";
import { PageEditor } from "@/components/admin/editor/page-editor";
import { PagePublishControls } from "@/components/admin/pages/publish-controls";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const page = await getAdminPageById(Number(id));
  if (!page) return { title: "Not found" };
  return { title: `Edit page: ${page.key}` };
}

export default function PageEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={null}>
      <PageEditContent params={params} />
    </Suspense>
  );
}

async function PageEditContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const pageId = Number(rawId);
  if (isNaN(pageId)) notFound();

  const page = await getAdminPageById(pageId);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/pages" className="hover:text-neutral-700">
          Pages
        </Link>
        <span>/</span>
        <span className="text-neutral-600">{page.key}</span>
      </nav>

      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          Edit page
        </h2>
        <code className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-mono text-neutral-500">
          {page.key}
        </code>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_260px]">
        <PageEditor
          pageId={pageId}
          pageKey={page.key}
          translations={page.translations}
        />
        <PagePublishControls pageId={pageId} translations={page.translations} />
      </div>
    </div>
  );
}
