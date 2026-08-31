import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

export function getDatabaseUrl(): string | null {
  const url =
    process.env.POSTGRES_URL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_PRISMA_URL ??
    null;

  if (!url?.trim()) return null;
  return url.trim();
}

export function isDatabaseConfigured(): boolean {
  return getDatabaseUrl() !== null;
}

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDb() {
  if (!isDatabaseConfigured()) {
    throw new Error(
      "Database not configured. Set POSTGRES_URL (Vercel Postgres / Neon).",
    );
  }
  if (!_db) {
    const sql = neon(getDatabaseUrl()!);
    _db = drizzle(sql, { schema });
  }
  return _db;
}

/** Safe accessor — returns null when DB is not configured or unavailable */
export function tryGetDb() {
  if (!isDatabaseConfigured()) return null;
  try {
    return getDb();
  } catch {
    return null;
  }
}

export { schema };
