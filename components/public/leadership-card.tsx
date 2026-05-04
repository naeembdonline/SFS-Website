/**
 * Card component for leadership/committee members.
 */

import type { LeadershipMember } from "@/lib/data/public/leadership";

interface LeadershipCardProps {
  member: LeadershipMember;
}

/** Generate a consistent gradient from the member's name initial */
function avatarGradient(name: string): string {
  const colors = [
    ["#0b3d2e", "#1a6b52"],
    ["#0b3d2e", "#d4af37"],
    ["#1a4a6b", "#2e8bb0"],
    ["#4a1a6b", "#8b2eb0"],
    ["#6b1a1a", "#b04040"],
    ["#1a4a1a", "#4a8b40"],
  ];
  const idx = name.charCodeAt(0) % colors.length;
  return `linear-gradient(135deg, ${colors[idx][0]}, ${colors[idx][1]})`;
}

export function LeadershipCard({ member }: LeadershipCardProps) {
  const initial = member.name.charAt(0).toUpperCase();

  return (
    <article
      className="group flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
      style={{ borderColor: "#e5e7eb" }}
    >
      {/* Avatar */}
      <div className="mb-5 flex items-center gap-4">
        <div
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold text-white shadow-md"
          style={{ background: avatarGradient(member.name) }}
          aria-hidden="true"
        >
          {initial}
        </div>
        <div>
          <h3
            className="text-base font-bold leading-tight"
            style={{ color: "var(--color-brand-black)" }}
          >
            {member.name}
          </h3>
          {member.roleTitle && (
            <p
              className="mt-0.5 text-sm font-medium"
              style={{ color: "var(--color-accent-gold)" }}
            >
              {member.roleTitle}
            </p>
          )}
        </div>
      </div>

      {/* Bio */}
      {member.bio && (
        <p className="line-clamp-4 text-sm leading-relaxed text-neutral-500">
          {member.bio}
        </p>
      )}
    </article>
  );
}
