/**
 * Sanitized HTML prose renderer.
 * Body content is pre-sanitized on write (admin side) — this component
 * renders it verbatim inside a prose container. Never use with user-supplied
 * raw HTML; only use with DB-stored body fields that passed sanitization.
 */

import { cn } from "@/lib/utils/cn";

interface ProseProps {
  html: string;
  className?: string;
}

export function Prose({ html, className }: ProseProps) {
  return (
    <div
      className={cn(
        // Base typography — inherits per-locale line-height from :lang() rules in globals.css
        "prose-content max-w-none",
        // Headings
        "[&_h2]:mt-10 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-[--color-text-primary]",
        "[&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_h3]:text-[--color-text-primary]",
        "[&_h4]:mt-6 [&_h4]:mb-2 [&_h4]:text-lg [&_h4]:font-semibold [&_h4]:text-[--color-text-primary]",
        // Body
        "[&_p]:my-4 [&_p]:text-[--color-text-secondary]",
        // Links
        "[&_a]:text-[--color-brand-deep] [&_a]:underline [&_a]:underline-offset-2 [&_a:hover]:text-[--color-accent-green]",
        // Lists
        "[&_ul]:my-4 [&_ul]:list-disc [&_ul]:ps-6 [&_ul_li]:my-1 [&_ul_li]:text-[--color-text-secondary]",
        "[&_ol]:my-4 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol_li]:my-1 [&_ol_li]:text-[--color-text-secondary]",
        // Blockquote
        "[&_blockquote]:my-6 [&_blockquote]:border-s-4 [&_blockquote]:border-[--color-brand-deep] [&_blockquote]:ps-4 [&_blockquote]:italic [&_blockquote]:text-[--color-text-muted]",
        // Code
        "[&_code]:rounded [&_code]:bg-[--color-bg-subtle] [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-sm [&_code]:font-mono",
        "[&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-[--color-bg-subtle] [&_pre]:p-4",
        // HR
        "[&_hr]:my-8 [&_hr]:border-[--color-border]",
        // Images
        "[&_img]:my-6 [&_img]:rounded-lg [&_img]:w-full [&_img]:h-auto",
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
