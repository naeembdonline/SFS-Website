import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { ok: boolean; latencyMs?: number; error?: string }> = {};
  let overallOk = true;

  // Database check
  const dbStart = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    checks.database = { ok: true, latencyMs: Date.now() - dbStart };
  } catch (err) {
    overallOk = false;
    checks.database = {
      ok: false,
      latencyMs: Date.now() - dbStart,
      error: err instanceof Error ? err.message : "unknown",
    };
  }

  // Object storage check (lightweight - just verify env)
  checks.storage = {
    ok: Boolean(process.env.R2_ENDPOINT || process.env.R2_ACCOUNT_ID),
  };
  if (!checks.storage.ok) overallOk = false;

  return NextResponse.json(
    {
      status: overallOk ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      checks,
    },
    { status: overallOk ? 200 : 503 }
  );
}
