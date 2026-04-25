import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { getAdminPostList } from "@/lib/data/admin/posts";
import { cn } from "@/lib/utils/cn";
import type { PostType } from "@/lib/data/admin/posts";

export const metadata: Metadata = { title: "Posts" };

interface PostsPageProps {
  searchParams: Promise<{ type?: string }>;
}

const STATUS_STYLES = {
  published: "bg-green-50 text-green-700",
  draft: "bg-yellow-50 text-yellow-700",
  missing: "bg-neutral-100 text-neutral-400",
};

export default function PostsPage({ searchParams }: PostsPageProps) {
  return (
    <Suspense fallback={null}>
      <PostsListContent searchParams={searchParams} />
    </Suspense>
  );
}

async function PostsListContent({ searchParams }: PostsPageProps) {
  const { type: rawType } = await searchParams;
  const type: PostType | undefined =
    rawType === "blog" || rawType === "news" ? rawType : undefined;

  const posts = await getAdminPostList(type);

  const title = type === "blog" ? "Blog" : type === "news" ? "News" : "All Posts";

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{title}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">
            {posts.length} {posts.length === 1 ? "post" : "posts"}
          </p>
        </div>
        <Link
          href={`/admin/posts/new${type ? `?type=${type}` : ""}`}
          className="rounded-lg bg-[#0B3D2E] px-4 py-2 text-sm font-medium text-white hover:bg-[#0a3527]"
        >
          + New post
        </Link>
      </div>

      {/* Type filter tabs */}
      <div className="mb-4 flex gap-2">
        {[
          { label: "All", href: "/admin/posts" },
          { label: "Blog", href: "/admin/posts?type=blog" },
          { label: "News", href: "/admin/posts?type=news" },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              (!type && tab.label === "All") ||
                (type === "blog" && tab.label === "Blog") ||
                (type === "news" && tab.label === "News")
                ? "bg-[#0B3D2E]/8 text-[#0B3D2E]"
                : "text-neutral-500 hover:bg-neutral-100"
            )}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Table */}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-16 text-center">
          <p className="text-sm text-neutral-400">No posts yet.</p>
          <Link
            href={`/admin/posts/new${type ? `?type=${type}` : ""}`}
            className="mt-3 inline-block text-sm font-medium text-[#0B3D2E] hover:underline"
          >
            Create your first post →
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50">
                <th className="px-5 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Title (BN)
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Type
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
                <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wider text-neutral-400">
                  Created
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {posts.map((post) => (
                <tr key={post.id} className="group hover:bg-neutral-50/50">
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-neutral-900">
                      {post.bn.title ?? (
                        <span className="italic text-neutral-400">No BN title</span>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="rounded bg-neutral-100 px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide text-neutral-500">
                      {post.type}
                    </span>
                  </td>
                  {(["bn", "en", "ar"] as const).map((locale) => (
                    <td key={locale} className="px-4 py-3.5 text-center">
                      <span
                        className={cn(
                          "rounded px-1.5 py-0.5 text-[11px] font-medium",
                          STATUS_STYLES[post[locale].status]
                        )}
                      >
                        {post[locale].status === "missing"
                          ? "–"
                          : post[locale].status}
                      </span>
                    </td>
                  ))}
                  <td className="px-4 py-3.5 text-xs text-neutral-400">
                    {post.createdAt.toLocaleDateString("en", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-4 py-3.5 text-end">
                    <Link
                      href={`/admin/posts/${post.id}`}
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
