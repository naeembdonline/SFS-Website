import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminUserListItem {
  id: number;
  email: string;
  displayName: string | null;
  role: "admin" | "editor";
  isActive: boolean;
  totpEnabled: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export async function getAdminUserList(): Promise<AdminUserListItem[]> {
  try {
    const rows = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        role: schema.users.role,
        isActive: schema.users.isActive,
        totpEnabled: schema.users.totpEnabled,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .orderBy(desc(schema.users.createdAt));

    return rows as AdminUserListItem[];
  } catch {
    return [];
  }
}

export async function getAdminUserById(
  id: number
): Promise<AdminUserListItem | null> {
  try {
    const [row] = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        displayName: schema.users.displayName,
        role: schema.users.role,
        isActive: schema.users.isActive,
        totpEnabled: schema.users.totpEnabled,
        lastLoginAt: schema.users.lastLoginAt,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, id))
      .limit(1);

    return (row as AdminUserListItem) ?? null;
  } catch {
    return null;
  }
}
