"use server";

import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { withAdmin, ActionError, type ActionState } from "@/lib/auth/with-admin";
import { writeAuditLog } from "@/lib/audit";
import { updateSubmissionSchema } from "@/lib/validation/submissions";

export async function updateSubmissionAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  return withAdmin(async (ctx) => {
    const parsed = updateSubmissionSchema.safeParse({
      submissionId: Number(formData.get("submissionId")),
      status: formData.get("status"),
      adminNotes: formData.get("adminNotes"),
    });
    if (!parsed.success) {
      throw new ActionError(parsed.error.issues[0]?.message ?? "Invalid submission update", "VALIDATION_ERROR");
    }
    const { submissionId, status, adminNotes } = parsed.data;

    await db.transaction(async (tx) => {
      const patch: Record<string, unknown> = {
        status,
        adminNotes: adminNotes ?? null,
      };
      if (status === "handled") {
        patch.handledAt = new Date();
        patch.handledByUserId = ctx.user.id;
      }

      await tx
        .update(schema.submissions)
        .set(patch)
        .where(eq(schema.submissions.id, submissionId));

      await writeAuditLog(tx, {
        requestId: ctx.requestId,
        actorUserId: ctx.user.id,
        actorRole: ctx.user.role,
        action: "submission.update",
        entityType: "submission",
        entityId: submissionId,
        diff: { status, adminNotes: adminNotes ?? null },
        ip: ctx.ip,
        userAgent: ctx.userAgent,
      });
    });
  });
}
