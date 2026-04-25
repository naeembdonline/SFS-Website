/**
 * Audit log helper.
 *
 * RULE: writeAuditLog MUST be called inside the same DB transaction as the
 * mutation. If the audit write fails, the transaction rolls back — fail-closed.
 *
 * The `diff` field MUST never contain:
 *   - password_hash
 *   - totp_secret_encrypted
 *   - code_hash (recovery codes)
 *   - any raw token value
 *
 * Usage inside a transaction:
 *   await db.transaction(async (tx) => {
 *     await tx.insert(schema.posts).values(...);
 *     await writeAuditLog(tx, {
 *       requestId: ctx.requestId,
 *       actorUserId: ctx.user.id,
 *       actorRole: ctx.user.role,
 *       action: "post.create",
 *       entityType: "post",
 *       entityId: newPost.id,
 *       diff: { type: "blog", title_bn: "..." },
 *       ip: ctx.ip,
 *       userAgent: ctx.userAgent,
 *     });
 *   });
 */

import { auditLog } from "@/lib/db/schema";
import type { Locale } from "@/lib/i18n/config";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof import("@/lib/db").db.transaction>[0]>[0];

export interface AuditParams {
  requestId: string;
  actorUserId: number | null;
  actorRole: string;
  action: string;
  entityType?: string;
  entityId?: number;
  localeAffected?: Locale;
  diff?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

// ─── Write ────────────────────────────────────────────────────────────────────

export async function writeAuditLog(tx: Tx, params: AuditParams): Promise<void> {
  await tx.insert(auditLog).values({
    requestId: params.requestId,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    localeAffected: params.localeAffected,
    diff: params.diff,
    ip: params.ip,
    userAgent: params.userAgent,
  });
}

// Re-export the Tx type for use in other modules
export type { Tx };
