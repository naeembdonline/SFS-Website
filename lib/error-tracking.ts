/**
 * Lightweight error tracking — logs to file + optional webhook (Discord/Slack/Telegram).
 *
 * No external SaaS dependency. For VPS self-hosted deployments where Sentry
 * is overkill. Errors are persisted to /var/log/sfs-errors.log via the
 * structured logger (PM2 captures stderr → log file).
 */

interface ErrorContext {
  url?: string;
  method?: string;
  userId?: number;
  requestId?: string;
  userAgent?: string;
  ip?: string;
  extra?: Record<string, unknown>;
}

const RATE_LIMIT_KEY = new Map<string, number>();
const ALERT_RATE_LIMIT_MS = 60_000;

function shouldAlert(fingerprint: string): boolean {
  const now = Date.now();
  const last = RATE_LIMIT_KEY.get(fingerprint) ?? 0;
  if (now - last < ALERT_RATE_LIMIT_MS) return false;
  RATE_LIMIT_KEY.set(fingerprint, now);
  return true;
}

function fingerprint(error: unknown): string {
  if (error instanceof Error) {
    const firstLine = error.stack?.split("\n")[1] ?? error.message;
    return `${error.name}:${firstLine}`;
  }
  return String(error).slice(0, 200);
}

async function sendWebhook(payload: {
  message: string;
  context: ErrorContext;
}): Promise<void> {
  const url = process.env.ERROR_WEBHOOK_URL;
  if (!url) return;

  const type = process.env.ERROR_WEBHOOK_TYPE ?? "discord";
  let body: unknown;

  if (type === "discord") {
    body = {
      content: `🔴 **Error**: \`${payload.message}\``,
      embeds: [
        {
          color: 0xff0000,
          fields: [
            { name: "URL", value: payload.context.url ?? "n/a", inline: true },
            { name: "Method", value: payload.context.method ?? "n/a", inline: true },
            { name: "User", value: String(payload.context.userId ?? "anon"), inline: true },
            { name: "Request ID", value: payload.context.requestId ?? "n/a" },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };
  } else if (type === "slack") {
    body = {
      text: `🔴 *Error*: \`${payload.message}\``,
      attachments: [
        {
          color: "danger",
          fields: [
            { title: "URL", value: payload.context.url ?? "n/a", short: true },
            { title: "Method", value: payload.context.method ?? "n/a", short: true },
            { title: "User", value: String(payload.context.userId ?? "anon"), short: true },
          ],
        },
      ],
    };
  } else if (type === "telegram") {
    const chatId = process.env.TELEGRAM_CHAT_ID;
    body = {
      chat_id: chatId,
      text: `🔴 Error: ${payload.message}\nURL: ${payload.context.url}\nUser: ${payload.context.userId ?? "anon"}`,
      parse_mode: "Markdown",
    };
  }

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // swallow: alerting failure should not cascade
  }
}

export function trackError(error: unknown, context: ErrorContext = {}): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;
  const fp = fingerprint(error);

  console.error(
    JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      message,
      stack,
      fingerprint: fp,
      ...context,
    })
  );

  if (shouldAlert(fp)) {
    void sendWebhook({ message, context });
  }
}

export function trackEvent(
  name: string,
  data: Record<string, unknown> = {}
): void {
  console.log(
    JSON.stringify({
      level: "info",
      timestamp: new Date().toISOString(),
      event: name,
      ...data,
    })
  );
}

if (typeof process !== "undefined" && process.on) {
  process.on("unhandledRejection", (reason) => {
    trackError(reason, { extra: { type: "unhandledRejection" } });
  });
  process.on("uncaughtException", (error) => {
    trackError(error, { extra: { type: "uncaughtException" } });
  });
}
