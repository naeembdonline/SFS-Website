import { desc, eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getSession, type SessionUser } from "@/lib/auth/session";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

export interface AdminAuditLogItem {
  id: number;
  at: Date;
  actorUserId: number | null;
  actorEmail: string | null;
  actorDisplayName: string | null;
  actorRole: string | null;
  action: string;
  entityType: string | null;
  entityId: number | null;
  localeAffected: "bn" | "en" | "ar" | null;
  diff: JsonValue | null;
  ip: string | null;
  createdAt: Date;
}

export async function getAdminAuditLogs(
  limit = 50,
  offset = 0
): Promise<AdminAuditLogItem[]> {
  const user = await requireAdminRole();
  void user;

  const rows = await db
    .select({
      id: schema.auditLog.id,
      at: schema.auditLog.at,
      actorUserId: schema.auditLog.actorUserId,
      actorEmail: schema.users.email,
      actorDisplayName: schema.users.displayName,
      actorRole: schema.auditLog.actorRole,
      action: schema.auditLog.action,
      entityType: schema.auditLog.entityType,
      entityId: schema.auditLog.entityId,
      localeAffected: schema.auditLog.localeAffected,
      diff: schema.auditLog.diff,
      ip: schema.auditLog.ip,
      createdAt: schema.auditLog.createdAt,
    })
    .from(schema.auditLog)
    .leftJoin(schema.users, eq(schema.users.id, schema.auditLog.actorUserId))
    .orderBy(desc(schema.auditLog.at))
    .limit(clampLimit(limit))
    .offset(Math.max(0, offset));

  return rows.map((row) => ({
    id: row.id,
    at: row.at,
    actorUserId: row.actorUserId ?? null,
    actorEmail: row.actorEmail ?? null,
    actorDisplayName: row.actorDisplayName ?? null,
    actorRole: row.actorRole ?? null,
    action: row.action,
    entityType: row.entityType ?? null,
    entityId: row.entityId ?? null,
    localeAffected: (row.localeAffected as "bn" | "en" | "ar" | null) ?? null,
    diff: sanitizeJson(row.diff),
    ip: row.ip ?? null,
    createdAt: row.createdAt,
  }));
}

async function requireAdminRole(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    redirect("/admin/login");
  }

  if (session.user.role !== "admin") {
    notFound();
  }

  return session.user;
}

function clampLimit(limit: number): number {
  if (!Number.isFinite(limit)) return 50;
  return Math.min(Math.max(Math.trunc(limit), 1), 200);
}

function sanitizeJson(value: unknown): JsonValue | null {
  if (value === null || value === undefined) return null;

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeJson(item));
  }

  if (typeof value === "object") {
    const output: { [key: string]: JsonValue } = {};
    for (const [key, nestedValue] of Object.entries(
      value as Record<string, unknown>
    )) {
      output[key] = isSensitiveKey(key) ? "[redacted]" : sanitizeJson(nestedValue);
    }
    return output;
  }

  return String(value);
}

function isSensitiveKey(key: string): boolean {
  return /password|totp|recovery|session|token|secret|cookie|authorization/i.test(
    key
  );
}
