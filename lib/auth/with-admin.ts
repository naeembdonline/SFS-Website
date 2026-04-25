/**
 * withAdmin — Server Action guard.
 *
 * Wraps a Server Action callback with:
 *  1. Session validation (reads cookie, queries DB)
 *  2. Role check (admin | editor)
 *  3. Structured error returns (never throws to the client)
 *  4. Re-throws Next.js special errors (redirect, notFound)
 *
 * Usage:
 *   export async function myAction(prev: ActionState, fd: FormData) {
 *     "use server";
 *     return withAdmin(async (ctx) => {
 *       // ctx.user, ctx.sessionId, ctx.ip, ctx.userAgent available
 *       ...
 *       return { id: newRow.id };
 *     });
 *   }
 *
 * Role enforcement:
 *   withAdmin(fn)                    → editor or admin (default)
 *   withAdmin(fn, { role: "admin" }) → admin only
 */

import { headers } from "next/headers";
import { getSession, type SessionUser } from "./session";

// ─── Types ────────────────────────────────────────────────────────────────────

export type UserRole = "admin" | "editor";

export interface AdminContext {
  user: SessionUser;
  sessionId: string;
  ip: string | undefined;
  userAgent: string | undefined;
  requestId: string;
}

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; code: string };

export type ActionState<T = void> = ActionResult<T> | null;

// ─── Error class ──────────────────────────────────────────────────────────────

export class ActionError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = "ActionError";
  }
}

// ─── Guard ────────────────────────────────────────────────────────────────────

function isNextSpecialError(e: unknown): boolean {
  // Next.js redirect() and notFound() throw objects with a digest property.
  // These must propagate — do not swallow them.
  return (
    typeof e === "object" &&
    e !== null &&
    "digest" in e &&
    typeof (e as Record<string, unknown>).digest === "string"
  );
}

async function getRequestMeta(): Promise<{
  ip: string | undefined;
  userAgent: string | undefined;
  requestId: string;
}> {
  const h = await headers();
  const ip =
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    undefined;
  const userAgent = h.get("user-agent") ?? undefined;
  // Simple request ID using crypto.randomUUID (available in Node 16+)
  const requestId =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : Math.random().toString(36).slice(2);
  return { ip, userAgent, requestId };
}

export async function withAdmin<T>(
  action: (ctx: AdminContext) => Promise<T>,
  options?: { role?: UserRole }
): Promise<ActionResult<T>> {
  try {
    const session = await getSession();

    if (!session) {
      return { ok: false, error: "You must be logged in.", code: "UNAUTHORIZED" };
    }

    const requiredRole = options?.role ?? "editor";
    if (requiredRole === "admin" && session.user.role !== "admin") {
      return {
        ok: false,
        error: "You don't have permission to perform this action.",
        code: "FORBIDDEN",
      };
    }

    const { ip, userAgent, requestId } = await getRequestMeta();

    const ctx: AdminContext = {
      user: session.user,
      sessionId: session.sessionId,
      ip,
      userAgent,
      requestId,
    };

    const data = await action(ctx);
    return { ok: true, data };
  } catch (e) {
    if (isNextSpecialError(e)) throw e; // redirect() / notFound()
    if (e instanceof ActionError) {
      return { ok: false, error: e.message, code: e.code };
    }
    console.error("[withAdmin] unexpected error:", e);
    return { ok: false, error: "An unexpected error occurred.", code: "INTERNAL" };
  }
}
