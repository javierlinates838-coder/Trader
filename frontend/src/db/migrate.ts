import { readFileSync } from "fs";
import { join } from "path";
import { Pool } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../db";

export async function runMigrations(): Promise<{ ok: boolean; message: string }> {
  const url = getDatabaseUrl();
  if (!url) {
    return { ok: false, message: "POSTGRES_URL not configured" };
  }

  const pool = new Pool({ connectionString: url });
  const migrationPath = join(process.cwd(), "drizzle", "0000_init.sql");
  const migration = readFileSync(migrationPath, "utf-8");

  const statements = migration
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  for (const statement of statements) {
    await pool.query(statement);
  }

  await pool.end();

  return { ok: true, message: `Applied ${statements.length} migration statements` };
}
