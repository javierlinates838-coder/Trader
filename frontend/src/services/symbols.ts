import { eq } from "drizzle-orm";
import { tryGetDb, schema } from "@/db";
import { DEFAULT_SYMBOLS } from "@/lib/constants";

const { symbols } = schema;

export async function seedSymbols(
  tickers: readonly string[] = DEFAULT_SYMBOLS,
): Promise<{ inserted: number; existing: number }> {
  const db = tryGetDb();
  if (!db) return { inserted: 0, existing: 0 };

  let inserted = 0;
  let existing = 0;

  for (const ticker of tickers) {
    const upper = ticker.toUpperCase();
    const found = await db
      .select()
      .from(symbols)
      .where(eq(symbols.ticker, upper))
      .limit(1);

    if (found.length > 0) {
      existing++;
      continue;
    }

    await db.insert(symbols).values({ ticker: upper, enabled: true });
    inserted++;
  }

  return { inserted, existing };
}

export async function getEnabledSymbols(): Promise<string[]> {
  const db = tryGetDb();
  if (!db) return [...DEFAULT_SYMBOLS];

  const rows = await db
    .select()
    .from(symbols)
    .where(eq(symbols.enabled, true));

  if (rows.length === 0) return [...DEFAULT_SYMBOLS];
  return rows.map((r) => r.ticker);
}
