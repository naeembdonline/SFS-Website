/**
 * Redis-backed sliding-window rate limiter.
 *
 * Falls back to an in-memory map if REDIS_URL is not configured —
 * useful for local dev, but DO NOT rely on it in production with PM2 cluster
 * mode (each worker has its own memory).
 */

import { createClient, type RedisClientType } from "redis";

interface RateLimitOptions {
  key: string;
  limit: number;
  windowSeconds: number;
}

interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetAt: number;
}

let redis: RedisClientType | null = null;
let connecting: Promise<void> | null = null;

async function getRedis(): Promise<RedisClientType | null> {
  if (!process.env.REDIS_URL) return null;
  if (redis?.isReady) return redis;

  if (!connecting) {
    redis = createClient({ url: process.env.REDIS_URL });
    redis.on("error", (err) => console.error("[rate-limit] Redis error:", err));
    connecting = redis.connect().catch((err) => {
      console.error("[rate-limit] Redis connect failed:", err);
      redis = null;
    });
  }
  await connecting;
  return redis;
}

const memoryStore = new Map<string, number[]>();

function memoryRateLimit(opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const cutoff = now - windowMs;

  const timestamps = (memoryStore.get(opts.key) ?? []).filter((t) => t > cutoff);
  const ok = timestamps.length < opts.limit;

  if (ok) timestamps.push(now);
  memoryStore.set(opts.key, timestamps);

  // Periodic cleanup
  if (memoryStore.size > 10000) {
    for (const [k, v] of memoryStore) {
      if (v.length === 0 || Math.max(...v) < cutoff) memoryStore.delete(k);
    }
  }

  return {
    ok,
    remaining: Math.max(0, opts.limit - timestamps.length),
    resetAt: timestamps[0] ? timestamps[0] + windowMs : now + windowMs,
  };
}

export async function rateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const client = await getRedis();
  if (!client) return memoryRateLimit(opts);

  const now = Date.now();
  const windowMs = opts.windowSeconds * 1000;
  const cutoff = now - windowMs;
  const redisKey = `rl:${opts.key}`;

  const multi = client.multi();
  multi.zRemRangeByScore(redisKey, 0, cutoff);
  multi.zAdd(redisKey, { score: now, value: `${now}-${Math.random()}` });
  multi.zCard(redisKey);
  multi.expire(redisKey, opts.windowSeconds);

  try {
    const results = (await multi.exec()) as unknown[];
    const count = Number(results[2] ?? 0);

    return {
      ok: count <= opts.limit,
      remaining: Math.max(0, opts.limit - count),
      resetAt: now + windowMs,
    };
  } catch (err) {
    console.error("[rate-limit] Redis op failed, falling back to memory:", err);
    return memoryRateLimit(opts);
  }
}

export function getClientIp(request: Request): string {
  const headers = request.headers;
  return (
    headers.get("cf-connecting-ip") ||
    headers.get("x-real-ip") ||
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

export async function rateLimitByIp(
  request: Request,
  scope: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  const ip = getClientIp(request);
  return rateLimit({ key: `${scope}:${ip}`, limit, windowSeconds });
}
