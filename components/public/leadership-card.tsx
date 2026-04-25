/**
 * Card component for leadership/committee members.
 * No detail page in MVP — card is purely presentational.
 */

import type { LeadershipMember } from "@/lib/data/public/leadership";

interface LeadershipCardProps {
  member: LeadershipMember;
}

export function LeadershipCard({ member }: LeadershipCardProps) {
  return (
    <article className="flex flex-col items-center gap-4 rounded-xl border border-[--color-border] bg-[--color-bg-card] p-6 text-center">
      {/* Avatar placeholder — replaced with Image in Phase 18 once media pipeline exists */}
      <div
        className="flex h-20 w-20 items-center justify-center rounded-full bg-[--color-brand-deep]/15 text-3xl font-bold text-[--color-brand-deep]"
        aria-hidden="true"
      >
        {member.name.charAt(0)}
      </div>

      <div>
        <h3 className="text-base font-semibold text-[--color-text-primary]">
          {member.name}
        </h3>
        {member.roleTitle && (
          <p className="mt-0.5 text-sm text-[--color-text-muted]">
            {member.roleTitle}
          </p>
        )}
      </div>

      {member.bio && (
        <p className="text-sm leading-relaxed text-[--color-text-secondary]">
          {member.bio}
        </p>
      )}
    </article>
  );
}
