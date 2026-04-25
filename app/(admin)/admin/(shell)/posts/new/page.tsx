import type { Metadata } from "next";
import Link from "next/link";
import { ContentEditor } from "@/components/admin/editor/content-editor";
import type { PostType } from "@/lib/data/admin/posts";

export const metadata: Metadata = { title: "New post" };

interface NewPostPageProps {
  searchParams: Promise<{ type?: string }>;
}

export default async function NewPostPage({ searchParams }: NewPostPageProps) {
  const { type: rawType } = await searchParams;
  const type: PostType =
    rawType === "blog" || rawType === "news" ? rawType : "blog";

  return (
    <div className="mx-auto max-w-4xl">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-sm text-neutral-400">
        <Link href="/admin/posts" className="hover:text-neutral-700">
          Posts
        </Link>
        <span>/</span>
        <span className="text-neutral-600">New {type} post</span>
      </nav>

      {/* Type badge */}
      <div className="mb-6 flex items-center gap-3">
        <h2 className="text-lg font-semibold text-neutral-900">
          New {type === "blog" ? "blog post" : "news article"}
        </h2>
        <span className="rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-neutral-500">
          {type}
        </span>
      </div>

      <ContentEditor type={type} />
    </div>
  );
}
