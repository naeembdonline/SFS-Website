/**
 * Public submission data functions.
 *
 * Called from app/api/submissions/route.ts — the only public write path.
 * Runs inside a DB transaction so the audit log is always co-committed.
 */

import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { writeAuditLog } from "@/lib/audit";

export interface CreateSubmissionInput {
  kind: "contact" | "advisory";
  name: string;
  email: string;
  subject: string | null;
  message: string;
  locale: "bn" | "en" | "ar" | null;
  ip: string | undefined;
  userAgent: string | undefined;
  requestId: string;
}

/**
 * Inserts a new submission and writes an audit log entry atomically.
 * Returns the new submission id.
 */
export async function createSubmission(
  input: CreateSubmissionInput
): Promise<number> {
  let submissionId = 0;

  await db.transaction(async (tx) => {
    const [created] = await tx
      .insert(schema.submissions)
      .values({
        kind: input.kind,
        name: input.name,
        email: input.email,
        subject: input.subject,
        message: input.message,
        locale: input.locale,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      })
      .returning({ id: schema.submissions.id });
    submissionId = created.id;

    await writeAuditLog(tx, {
      requestId: input.requestId,
      actorUserId: null,
      actorRole: "public",
      action: "submission.create",
      entityType: "submission",
      entityId: submissionId,
      diff: { kind: input.kind, locale: input.locale ?? null },
      ip: input.ip,
      userAgent: input.userAgent,
    });
  });

  return submissionId;
}
