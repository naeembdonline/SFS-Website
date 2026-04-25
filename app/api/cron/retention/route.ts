import { NextRequest, NextResponse } from "next/server";
import { runRetentionJob } from "@/lib/cron/retention";

/**
 * GET /api/cron/retention
 *
 * Secret-protected route for triggering data retention tasks.
 * Expects Bearer token in Authorization header matching CRON_SECRET.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const stats = await runRetentionJob();

    return NextResponse.json({
      ok: true,
      timestamp: new Date().toISOString(),
      stats,
    });
  } catch (error) {
    console.error("[cron/retention] failed:", error);
    return NextResponse.json(
      { ok: false, error: "Retention job failed" },
      { status: 500 }
    );
  }
}
