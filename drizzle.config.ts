import { defineConfig } from "drizzle-kit";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

export default defineConfig({
  schema: "./lib/db/schema/index.ts",
  out: "./lib/db/migrations",
  dialect: "postgresql",
  // drizzle-kit will use 'pg' internally for postgresql dialect
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // Verbose output during migrations for audit visibility
  verbose: true,
  strict: true,
});
