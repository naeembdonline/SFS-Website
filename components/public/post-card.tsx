/**
 * Card component for blog + news list pages.
 * Server component — no client state needed.
 */

import Link from "next/link";
import type { PostListItem, PostType } from "@/lib/data/public/posts";
import type { Locale } from "@/lib/i18n/config";

interface PostCardProps {
  post: PostListItem;
  type: PostType;
  locale: Locale;
}

export function PostCard({ post, type, locale }: PostCardProps) {
  const href = `/${locale}/${type}/${post.slug}`;

  return (
    <article className="group flex flex-col gap-4 rounded-xl border border-neutral-100/10 bg-[--color-bg-card] p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-[--color-accent-gold]/30 hover:shadow-lg">
      <div className="flex items-center gap-3 text-xs uppercase tracking-widest">
        <span
          className="inline-block rounded-md bg-[--color-brand-deep]/10 px-2 py-1 font-bold text-[--color-brand-deep]"
        >
          {type}
        </span>
        {post.publishedAt && (
          <time dateTime={post.publishedAt.toISOString()} className="text-[--color-text-muted]">
            {post.publishedAt.toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      <h3 className="text-xl font-bold leading-tight text-[--color-text-primary] transition-colors group-hover:text-[--color-brand-deep]">
        <Link href={href} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>

      {post.excerpt && (
        <p className="line-clamp-3 text-sm leading-relaxed text-[--color-text-secondary]">
          {post.excerpt}
        </p>
      )}

      <div className="mt-auto flex items-center gap-2 pt-2 text-sm font-bold text-[--color-accent-gold]">
        <span className="uppercase tracking-widest">আরও পড়ুন</span>
        <span className="transition-transform group-hover:translate-x-1">→</span>
      </div>
    </article>
  );
}
