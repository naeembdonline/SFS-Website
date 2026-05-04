/**
 * Admin data layer — Dashboard stats.
 *
 * Import boundary: ONLY from (admin) routes.
 * No 'use cache' — admin data must always be fresh.
 */

import { count, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export interface DashboardStats {
  postCount: number;
  campaignCount: number;
  pendingSubmissions: number;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    const [posts, campaigns, submissions] = await Promise.all([
      db
        .select({ count: count() })
        .from(schema.posts)
        .where(isNull(schema.posts.deletedAt)),
      db
        .select({ count: count() })
        .from(schema.campaigns)
        .where(isNull(schema.campaigns.deletedAt)),
      db
        .select({ count: count() })
        .from(schema.submissions)
        .where(eq(schema.submissions.status, "new")),
    ]);

    return {
      postCount: posts[0]?.count ?? 0,
      campaignCount: campaigns[0]?.count ?? 0,
      pendingSubmissions: submissions[0]?.count ?? 0,
    };
  } catch {
    return { postCount: 0, campaignCount: 0, pendingSubmissions: 0 };
  }
}
