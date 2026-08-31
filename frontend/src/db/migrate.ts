import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { Pool } from "@neondatabase/serverless";
import { getDatabaseUrl } from "../db";

export async function runMigrations(): Promise<{ ok: boolean; message: string }> {
  const url = getDatabaseUrl();
  if (!url) {
    return { ok: false, message: "POSTGRES_URL not configured" };
  }

  const pool = new Pool({ connectionString: url });
  const drizzleDir = join(process.cwd(), "drizzle");
  const files = readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  let totalStatements = 0;

  for (const file of files) {
    const migration = readFileSync(join(drizzleDir, file), "utf-8");
    const statements = migration
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    for (const statement of statements) {
      await pool.query(statement);
      totalStatements++;
    }
  }

  await pool.end();

  return {
    ok: true,
    message: `Applied ${totalStatements} statements from ${files.length} migration files`,
  };
}
