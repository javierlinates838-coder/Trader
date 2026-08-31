import { NextResponse } from "next/server";
import { runMigrations } from "@/db/migrate";
import { seedSymbols } from "@/services/symbols";

export const dynamic = "force-dynamic";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET ?? process.env.MIGRATE_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Run DB migrations + seed symbols. Protect with MIGRATE_SECRET in production. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const migration = await runMigrations();
    const seed = await seedSymbols();

    return NextResponse.json({
      migration,
      seed,
    });
  } catch (err) {
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Migration failed",
      },
      { status: 500 },
    );
  }
}
