import { notFound } from "next/navigation";
import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminPostById } from "@/lib/data/admin/posts";
import { ContentEditor } from "@/components/admin/editor/content-editor";
import { PublishControls } from "@/components/admin/posts/publish-controls";

interface PostEditPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({
  params,
}: PostEditPageProps): Promise<Metadata> {
  const { id } = await params;
  const post = await getAdminPostById(Number(id));
  if (!post) return { title: "Not found" };
  const bnTitle = post.translations.find((t) => t.locale === "bn")?.title;
  return { title: bnTitle ? `Edit: ${bnTitle}` : "Edit post" };
}

export default function PostEditPage({ params }: PostEditPageProps) {
  return (
    <Suspense fallback={null}>
      <PostEditContent params={params} />
    </Suspense>
  );
}

async function PostEditContent({ params }: PostEditPageProps) {
  const { id: rawId } = await params;
  const postId = Number(rawId);

  if (isNaN(postId)) notFound();

  const post = await getAdminPostById(postId);
  if (!post || post.deletedAt) notFound();

  const bnTitle = post.translations.find((t) => t.locale === "bn")?.title;

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/posts" className="hover:text-neutral-700">
          Posts
        </Link>
        <span>/</span>
        <span className="text-neutral-600 line-clamp-1">
          {bnTitle ?? `Post #${postId}`}
        </span>
      </nav>

      {/* Page header */}
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          {bnTitle ?? "Edit post"}
        </h2>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {post.type}
        </span>
        <span className="text-xs text-neutral-400">ID #{postId}</span>
      </div>

      {/* Two-column layout: editor (wide) + controls (narrow) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_260px]">
        {/* Content editor */}
        <div>
          <ContentEditor
            postId={postId}
            type={post.type}
            translations={post.translations}
          />
        </div>

        {/* Publish controls sidebar */}
        <div className="space-y-4">
          <PublishControls
            postId={postId}
            translations={post.translations}
          />

          {/* Post metadata */}
          <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
            <div className="border-b border-neutral-100 px-5 py-3">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
                Info
              </h3>
            </div>
            <dl className="divide-y divide-neutral-100">
              <MetaRow label="Post ID" value={`#${postId}`} />
              <MetaRow label="Type" value={post.type} />
              <MetaRow
                label="Created"
                value={post.createdAt.toLocaleDateString("en", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
              <MetaRow
                label="Modified"
                value={post.updatedAt.toLocaleDateString("en", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-2.5">
      <dt className="text-xs text-neutral-400">{label}</dt>
      <dd className="text-xs font-medium text-neutral-700">{value}</dd>
    </div>
  );
}
