import type { Dictionary } from "@/lib/i18n/dict";

interface SkipLinkProps {
  dict: Dictionary;
}

export function SkipLink({ dict }: SkipLinkProps) {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:start-4 focus:top-4 focus:z-[200]
        focus:rounded-md focus:bg-brand-black focus:px-4 focus:py-2
        focus:text-sm focus:font-medium focus:text-white
        focus:shadow-md focus:outline-none
      "
    >
      {dict.skip.toContent}
    </a>
  );
}
