/**
 * Public data — leadership / committee members.
 * No detail pages in MVP (Phase 2/6 decision).
 * Import boundary: public routes only.
 */

// import { cacheTag } from "next/cache"; // Disabled for Cloudflare Pages compatibility
import { eq, and, isNull, asc } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadershipMember = {
  id: number;
  name: string;
  roleTitle: string | null;
  bio: string | null;
  photoMediaId: number | null;
  displayOrder: number;
};

// ─── List ─────────────────────────────────────────────────────────────────────

export async function getLeadershipMembers(
  locale: Locale
): Promise<LeadershipMember[]> {
  // "use cache"; // Disabled for Cloudflare Pages compatibility
  // cacheTag(`leadership`, `leadership-${locale}`); // Disabled for Cloudflare Pages compatibility

  try {
    const rows = await db
      .select({
        id: schema.leadership.id,
        name: schema.leadershipTranslations.name,
        roleTitle: schema.leadershipTranslations.roleTitle,
        bio: schema.leadershipTranslations.bio,
        photoMediaId: schema.leadership.photoMediaId,
        displayOrder: schema.leadership.displayOrder,
      })
      .from(schema.leadership)
      .innerJoin(
        schema.leadershipTranslations,
        and(
          eq(schema.leadershipTranslations.leadershipId, schema.leadership.id),
          eq(schema.leadershipTranslations.locale, locale)
        )
      )
      .where(
        and(
          isNull(schema.leadership.deletedAt),
          eq(schema.leadership.isVisible, true)
        )
      )
      .orderBy(asc(schema.leadership.displayOrder));

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      roleTitle: r.roleTitle ?? null,
      bio: r.bio ?? null,
      photoMediaId: r.photoMediaId ?? null,
      displayOrder: Number(r.displayOrder),
    }));
  } catch {
    return [];
  }
}
