import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { and, eq, gt, sql } from "drizzle-orm";
import { Resend } from "resend";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";
import { submissionSchema } from "@/lib/validation/submissions";
import { createSubmission } from "@/lib/data/public/submissions";

const SUBMISSION_RATE_WINDOW_MINUTES = 10;
const SUBMISSION_RATE_LIMIT_IP = 5;

async function getClientIp(): Promise<string | undefined> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? undefined;
}

async function isRateLimited(bucket: string, windowMinutes: number, maxCount: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000);
  const [row] = await db
    .select({ count: sql<number>`count(*)` })
    .from(schema.rateLimits)
    .where(and(eq(schema.rateLimits.bucket, bucket), gt(schema.rateLimits.windowStart, windowStart)));

  const count = Number(row?.count ?? 0);
  if (count >= maxCount) return true;

  const currentWindow = new Date(Math.floor(Date.now() / 60000) * 60000);
  await db
    .insert(schema.rateLimits)
    .values({
      bucket,
      windowStart: currentWindow,
      count: 1,
    })
    .onConflictDoUpdate({
      target: [schema.rateLimits.bucket, schema.rateLimits.windowStart],
      set: { count: sql`${schema.rateLimits.count} + 1` },
    });
  return false;
}

async function verifyTurnstile(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) return false;
  const form = new FormData();
  form.set("secret", secret);
  form.set("response", token);
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: form,
    });
    if (!res.ok) return false;
    const json = (await res.json()) as { success?: boolean };
    return Boolean(json.success);
  } catch {
    return false;
  }
}

function enqueueSubmissionEmail(payload: {
  kind: "contact" | "advisory";
  name: string;
  email: string;
  subject: string | null;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const inbox = process.env.EMAIL_STAFF_INBOX;
  if (!apiKey || !from || !inbox) return;

  const resend = new Resend(apiKey);
  setTimeout(() => {
    void resend.emails.send({
      from,
      to: [inbox],
      subject: `[${payload.kind.toUpperCase()}] ${payload.subject ?? "New submission"} — ${payload.name}`,
      text: [
        `Kind: ${payload.kind}`,
        `Name: ${payload.name}`,
        `Email: ${payload.email}`,
        `Subject: ${payload.subject ?? "-"}`,
        "",
        payload.message,
      ].join("\n"),
    });
  }, 0);
}

export async function POST(req: Request) {
  const ip = await getClientIp();
  const requestId = crypto.randomUUID();
  const userAgent = req.headers.get("user-agent") ?? undefined;

  if (ip) {
    const blocked = await isRateLimited(
      `submission:ip:${ip}`,
      SUBMISSION_RATE_WINDOW_MINUTES,
      SUBMISSION_RATE_LIMIT_IP
    );
    if (blocked) {
      return NextResponse.json(
        { ok: false, error: "Too many submissions. Please try again later." },
        { status: 429 }
      );
    }
  }

  const body = (await req.json()) as Record<string, unknown>;
  const parsed = submissionSchema.safeParse({
    kind: body.kind,
    name: body.name,
    email: body.email,
    subject: body.subject,
    message: body.message,
    locale: body.locale,
    honeypot: body.honeypot,
    turnstileToken: body.turnstileToken,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid submission payload." },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (input.honeypot) {
    return NextResponse.json({ ok: true }, { status: 200 });
  }

  const turnstileValid = await verifyTurnstile(input.turnstileToken, ip);
  if (!turnstileValid) {
    return NextResponse.json({ ok: false, error: "CAPTCHA verification failed." }, { status: 400 });
  }

  const submissionId = await createSubmission({
    kind: input.kind,
    name: input.name,
    email: input.email,
    subject: input.subject ?? null,
    message: input.message,
    locale: input.locale ?? null,
    ip,
    userAgent,
    requestId,
  });

  enqueueSubmissionEmail({
    kind: input.kind,
    name: input.name,
    email: input.email,
    subject: input.subject ?? null,
    message: input.message,
  });

  return NextResponse.json({ ok: true, id: submissionId }, { status: 201 });
}
