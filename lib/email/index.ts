/**
 * Unified email sender.
 * Supports Resend (default) and SMTP (Postfix/external).
 *
 * Provider selection:
 *   EMAIL_PROVIDER=resend  → use Resend API (requires RESEND_API_KEY)
 *   EMAIL_PROVIDER=smtp    → use SMTP (requires SMTP_HOST, SMTP_PORT)
 *   unset                  → auto: Resend if RESEND_API_KEY set, else SMTP
 */

import { Resend } from "resend";
import { createTransport, type Transporter } from "nodemailer";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
}

export interface SendEmailResult {
  ok: boolean;
  provider: "resend" | "smtp";
  messageId?: string;
  error?: string;
}

function getProvider(): "resend" | "smtp" {
  const explicit = process.env.EMAIL_PROVIDER;
  if (explicit === "resend" || explicit === "smtp") return explicit;
  return process.env.RESEND_API_KEY ? "resend" : "smtp";
}

function getDefaultFrom(): string {
  return (
    process.env.EMAIL_FROM ??
    process.env.SMTP_FROM ??
    "noreply@example.com"
  );
}

let cachedSmtp: Transporter | null = null;

function getSmtpTransport(): Transporter {
  if (cachedSmtp) return cachedSmtp;
  cachedSmtp = createTransport({
    host: process.env.SMTP_HOST ?? "localhost",
    port: Number(process.env.SMTP_PORT ?? 25),
    secure: process.env.SMTP_SECURE === "true",
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          }
        : undefined,
    tls: { rejectUnauthorized: process.env.SMTP_TLS_REJECT !== "false" },
  });
  return cachedSmtp;
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return { ok: false, provider: "resend", error: "RESEND_API_KEY not set" };
  }
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    const result = await resend.emails.send({
      from: input.from ?? getDefaultFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { ok: true, provider: "resend", messageId: result.data?.id };
  } catch (err) {
    return {
      ok: false,
      provider: "resend",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

async function sendViaSmtp(input: SendEmailInput): Promise<SendEmailResult> {
  try {
    const transport = getSmtpTransport();
    const info = await transport.sendMail({
      from: input.from ?? getDefaultFrom(),
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
      replyTo: input.replyTo,
    });
    return { ok: true, provider: "smtp", messageId: info.messageId };
  } catch (err) {
    return {
      ok: false,
      provider: "smtp",
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const provider = getProvider();
  const result =
    provider === "resend"
      ? await sendViaResend(input)
      : await sendViaSmtp(input);

  if (!result.ok) {
    console.error(
      `[email] Send failed via ${result.provider}: ${result.error}`,
      { to: input.to, subject: input.subject }
    );
  }

  return result;
}

export async function verifyEmailConfig(): Promise<{ ok: boolean; provider: string; error?: string }> {
  const provider = getProvider();
  if (provider === "resend") {
    return process.env.RESEND_API_KEY
      ? { ok: true, provider }
      : { ok: false, provider, error: "RESEND_API_KEY missing" };
  }
  try {
    await getSmtpTransport().verify();
    return { ok: true, provider };
  } catch (err) {
    return {
      ok: false,
      provider,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}
