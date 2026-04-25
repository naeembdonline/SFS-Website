import { customType } from "drizzle-orm/pg-core";

/**
 * CITEXT — case-insensitive text (requires pg extension citext).
 * Used for email fields so comparisons are case-insensitive at the DB level.
 * Extension must be enabled: CREATE EXTENSION IF NOT EXISTS citext;
 */
export const citext = customType<{ data: string }>({
  dataType() {
    return "citext";
  },
});

/**
 * INET — stores IPv4 or IPv6 addresses.
 * Used for IP logging in sessions, audit, submissions.
 */
export const inet = customType<{ data: string }>({
  dataType() {
    return "inet";
  },
});

/**
 * BYTEA — binary data.
 * Used for encrypted TOTP secrets.
 */
export const bytea = customType<{ data: Buffer }>({
  dataType() {
    return "bytea";
  },
});
