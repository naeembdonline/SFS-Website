import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

export interface AdminSubmissionItem {
  id: number;
  kind: "contact" | "advisory";
  name: string;
  email: string;
  subject: string | null;
  message: string;
  locale: "bn" | "en" | "ar" | null;
  status: "new" | "reviewed" | "handled" | "archived";
  ip: string | null;
  userAgent: string | null;
  adminNotes: string | null;
  handledAt: Date | null;
  handledByUserId: number | null;
  createdAt: Date;
}

export async function getAdminSubmissions(limit = 200): Promise<AdminSubmissionItem[]> {
  const rows = await db
    .select()
    .from(schema.submissions)
    .orderBy(desc(schema.submissions.createdAt))
    .limit(limit);

  return rows.map(mapRow);
}

export async function getAdminSubmissionById(
  id: number
): Promise<AdminSubmissionItem | null> {
  const [row] = await db
    .select()
    .from(schema.submissions)
    .where(eq(schema.submissions.id, id))
    .limit(1);

  return row ? mapRow(row) : null;
}

function mapRow(row: typeof schema.submissions.$inferSelect): AdminSubmissionItem {
  return {
    id: row.id,
    kind: row.kind as "contact" | "advisory",
    name: row.name,
    email: row.email,
    subject: row.subject ?? null,
    message: row.message,
    locale: (row.locale as "bn" | "en" | "ar" | null) ?? null,
    status: row.status as "new" | "reviewed" | "handled" | "archived",
    ip: row.ip ?? null,
    userAgent: row.userAgent ?? null,
    adminNotes: row.adminNotes ?? null,
    handledAt: row.handledAt ?? null,
    handledByUserId: row.handledByUserId ?? null,
    createdAt: row.createdAt,
  };
}
