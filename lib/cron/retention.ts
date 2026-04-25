import { lt, and, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Data retention job logic.
 *
 * Requirements:
 * 1. Nullify IPs in submissions table older than 90 days.
 * 2. Clean up expired entries in rate_limits table.
 */
export async function runRetentionJob() {
  const ninetyDaysAgo = new Date();
  ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

  // 1. Nullify IPs in submissions older than 90 days
  await db
    .update(schema.submissions)
    .set({ ip: null })
    .where(
      and(
        lt(schema.submissions.createdAt, ninetyDaysAgo),
        isNotNull(schema.submissions.ip)
      )
    );

  // 2. Clean up expired rate_limits
  // We'll remove entries where windowStart is older than 24 hours
  // (Most rate limits have short windows, 24h is a safe margin for cleanup)
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  await db
    .delete(schema.rateLimits)
    .where(lt(schema.rateLimits.windowStart, oneDayAgo));

  return {
    success: true,
  };
}
