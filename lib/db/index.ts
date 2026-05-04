import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import "@/lib/env";

/**
 * Drizzle client singleton.
 *
 * DATABASE_URL must be set in the environment.
 * Local Docker Postgres: postgres://user:password@localhost:5432/dbname
 * Neon production: postgres://user:password@host/dbname?sslmode=require
 *
 * This module is server-only. Never import from client components.
 */

const isBuild = process.env.NEXT_PHASE === "phase-production-build";
const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://dummy:dummy@localhost:5432/dummy?sslmode=disable";

if (!process.env.DATABASE_URL && !isBuild) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// Default to "pg" (self-hosted PostgreSQL on VPS).
// Set DATABASE_DRIVER=neon to use Neon serverless instead.
const driver = process.env.DATABASE_DRIVER ?? "pg";

type AppDb = NodePgDatabase<typeof schema>;

function createDb(): AppDb {
  if (driver === "neon") {
    const sql = neon(databaseUrl);
    return drizzleNeon(sql, { schema }) as unknown as AppDb;
  }

  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.DATABASE_POOL_MAX ?? 10),
    idleTimeoutMillis: Number(process.env.DATABASE_IDLE_TIMEOUT_MS ?? 30000),
    connectionTimeoutMillis: Number(process.env.DATABASE_CONNECT_TIMEOUT_MS ?? 5000),
    ssl: process.env.DATABASE_SSL === "true" ? { rejectUnauthorized: false } : undefined,
  });

  pool.on("error", (err) => {
    console.error("[db] Unexpected pool error:", err);
  });

  return drizzlePg(pool, { schema });
}

export const db = createDb();

export type DB = typeof db;
