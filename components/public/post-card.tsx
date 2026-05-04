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

const READ_MORE: Record<Locale, string> = {
  bn: "আরও পড়ুন",
  en: "Read more",
  ar: "اقرأ المزيد",
};

export function PostCard({ post, type, locale }: PostCardProps) {
  const href = `/${locale}/${type}/${post.slug}`;
  const readMore = READ_MORE[locale] ?? READ_MORE.en;

  return (
    <article
      className="group relative flex flex-col gap-3 rounded-xl border bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
      style={{ borderColor: "#e5e7eb" }}
    >
      {/* Meta row */}
      <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-widest">
        <span
          className="rounded-md px-2 py-1"
          style={{
            backgroundColor: "rgba(11,61,46,0.08)",
            color: "var(--color-brand-deep)",
          }}
        >
          {type}
        </span>
        {post.publishedAt && (
          <time
            dateTime={post.publishedAt.toISOString()}
            className="text-neutral-400"
          >
            {post.publishedAt.toLocaleDateString(locale, {
              year: "numeric",
              month: "short",
              day: "numeric",
            })}
          </time>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-lg font-bold leading-snug transition-colors group-hover:underline"
        style={{ color: "var(--color-brand-black)" }}
      >
        <Link href={href} className="after:absolute after:inset-0">
          {post.title}
        </Link>
      </h3>

      {/* Excerpt */}
      {post.excerpt && (
        <p className="line-clamp-3 text-sm leading-relaxed text-neutral-500">
          {post.excerpt}
        </p>
      )}

      {/* CTA */}
      <div
        className="mt-auto flex items-center gap-1.5 pt-2 text-xs font-bold uppercase tracking-widest"
        style={{ color: "var(--color-accent-gold)" }}
      >
        <span>{readMore}</span>
        <span
          className="inline-block transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        >
          →
        </span>
      </div>
    </article>
  );
}
