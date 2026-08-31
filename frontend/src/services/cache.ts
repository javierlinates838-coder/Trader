import { desc, eq, gt, sql, and } from "drizzle-orm";
import { tryGetDb, schema } from "@/db";
import {
  addSeconds,
  estimateCredits,
  isExpired,
  optionChainTtlSeconds,
  optionExpirationsTtlSeconds,
  stockBarTtlSeconds,
  stockQuoteTtlSeconds,
} from "@/lib/cache-utils";
import type {
  OptionChainResponse,
  OptionExpirationsResponse,
  StockQuoteResponse,
} from "@/types/marketdata";
import type { OHLCVBar, UnderlyingMetrics } from "@/types/underlying";

const {
  stockQuotes,
  stockBars,
  optionQuotes,
  optionContracts,
  optionExpirationsCache,
  optionChainCache,
  underlyingAnalysis,
  apiRequests,
} = schema;

export interface ApiLogEntry {
  endpoint: string;
  statusCode?: number;
  cacheHit?: boolean;
  error?: string;
  latencyMs?: number;
  creditsEstimated?: number;
}

export async function logApiRequest(entry: ApiLogEntry): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  try {
    await db.insert(apiRequests).values({
      endpoint: entry.endpoint,
      creditsEstimated:
        entry.creditsEstimated ?? estimateCredits(entry.endpoint),
      statusCode: entry.statusCode ?? null,
      cacheHit: entry.cacheHit ?? false,
      error: entry.error ?? null,
      latencyMs: entry.latencyMs ?? null,
    });
  } catch {
    // Non-fatal — don't break requests if logging fails
  }
}

export async function getCachedStockQuote(
  symbol: string,
): Promise<StockQuoteResponse | null> {
  const db = tryGetDb();
  if (!db) return null;

  const sym = symbol.toUpperCase();
  const rows = await db
    .select()
    .from(stockQuotes)
    .where(
      and(
        eq(stockQuotes.symbol, sym),
        gt(stockQuotes.expiresAt, new Date()),
      ),
    )
    .orderBy(desc(stockQuotes.fetchedAt))
    .limit(1);

  const row = rows[0];
  if (!row?.rawJson) return null;
  return row.rawJson as StockQuoteResponse;
}

export async function cacheStockQuote(
  symbol: string,
  data: StockQuoteResponse,
): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  const sym = symbol.toUpperCase();
  const now = new Date();
  const expiresAt = addSeconds(now, stockQuoteTtlSeconds());

  await db.insert(stockQuotes).values({
    symbol: sym,
    bid: data.bid?.[0] ?? null,
    ask: data.ask?.[0] ?? null,
    mid: data.mid?.[0] ?? null,
    last: data.last?.[0] ?? null,
    volume: data.volume?.[0] ?? null,
    change: data.change?.[0] ?? null,
    changePct: data.changepct?.[0] ?? null,
    quoteUpdated: data.updated?.[0] ?? null,
    rawJson: data,
    fetchedAt: now,
    expiresAt,
  });
}

export async function getCachedExpirations(
  underlying: string,
): Promise<OptionExpirationsResponse | null> {
  const db = tryGetDb();
  if (!db) return null;

  const sym = underlying.toUpperCase();
  const rows = await db
    .select()
    .from(optionExpirationsCache)
    .where(
      and(
        eq(optionExpirationsCache.underlying, sym),
        gt(optionExpirationsCache.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  return {
    s: "ok",
    expirations: row.expirations as string[],
    updated: row.updated ?? undefined,
  };
}

export async function cacheExpirations(
  underlying: string,
  data: OptionExpirationsResponse,
): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  const sym = underlying.toUpperCase();
  const now = new Date();
  const expiresAt = addSeconds(now, optionExpirationsTtlSeconds());

  await db
    .insert(optionExpirationsCache)
    .values({
      underlying: sym,
      expirations: data.expirations ?? [],
      updated: data.updated ?? null,
      fetchedAt: now,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: optionExpirationsCache.underlying,
      set: {
        expirations: data.expirations ?? [],
        updated: data.updated ?? null,
        fetchedAt: now,
        expiresAt,
      },
    });
}

export interface ChainCacheKey {
  underlying: string;
  expiration?: string;
  side?: string;
  range?: string;
}

function buildChainCacheKey(key: ChainCacheKey): string {
  return `${key.underlying}:${key.expiration ?? "all"}:${key.side ?? "all"}:${key.range ?? "all"}`;
}

export async function getCachedOptionChain(
  key: ChainCacheKey,
): Promise<OptionChainResponse | null> {
  const db = tryGetDb();
  if (!db) return null;

  const cacheKey = buildChainCacheKey(key);
  const rows = await db
    .select()
    .from(optionChainCache)
    .where(
      and(
        eq(optionChainCache.cacheKey, cacheKey),
        gt(optionChainCache.expiresAt, new Date()),
      ),
    )
    .limit(1);

  const row = rows[0];
  if (!row?.chainJson) return null;
  return row.chainJson as OptionChainResponse;
}

export async function cacheOptionChain(
  key: ChainCacheKey,
  data: OptionChainResponse,
): Promise<void> {
  const db = tryGetDb();
  if (!db || !data.optionSymbol?.length) return;

  const sym = key.underlying.toUpperCase();
  const cacheKey = buildChainCacheKey(key);
  const now = new Date();
  const expiresAt = addSeconds(now, optionChainTtlSeconds());
  const count = data.optionSymbol.length;

  await db
    .insert(optionChainCache)
    .values({
      cacheKey,
      underlying: sym,
      expiration: key.expiration ?? null,
      side: key.side ?? null,
      rangeFilter: key.range ?? null,
      contractCount: count,
      chainJson: data as unknown as Record<string, unknown>,
      fetchedAt: now,
      expiresAt,
    })
    .onConflictDoUpdate({
      target: optionChainCache.cacheKey,
      set: {
        contractCount: count,
        chainJson: data as unknown as Record<string, unknown>,
        fetchedAt: now,
        expiresAt,
      },
    });

  // Also persist individual contract quotes for Phase 3 queries
  const expiration = key.expiration ?? "";
  const rows = data.optionSymbol.map((optionSymbol, i) => ({
    optionSymbol,
    underlying: data.underlying?.[i] ?? sym,
    expiration,
    bid: data.bid?.[i] ?? null,
    ask: data.ask?.[i] ?? null,
    mid: data.mid?.[i] ?? null,
    last: data.last?.[i] ?? null,
    volume: data.volume?.[i] ?? null,
    openInterest: data.openInterest?.[i] ?? null,
    iv: data.iv?.[i] ?? null,
    delta: data.delta?.[i] ?? null,
    gamma: data.gamma?.[i] ?? null,
    theta: data.theta?.[i] ?? null,
    vega: data.vega?.[i] ?? null,
    underlyingPrice: data.underlyingPrice?.[i] ?? null,
    intrinsicValue: data.intrinsicValue?.[i] ?? null,
    extrinsicValue: data.extrinsicValue?.[i] ?? null,
    inTheMoney: data.inTheMoney?.[i] ?? null,
    quoteUpdated: data.updated?.[i] ?? null,
    rawJson: null,
    fetchedAt: now,
    expiresAt,
  }));

  const chunkSize = 100;
  for (let i = 0; i < rows.length; i += chunkSize) {
    await db.insert(optionQuotes).values(rows.slice(i, i + chunkSize));
  }

  for (let i = 0; i < count; i++) {
    const optionSymbol = data.optionSymbol[i];
    await db
      .insert(optionContracts)
      .values({
        optionSymbol,
        underlying: data.underlying?.[i] ?? sym,
        expiration: data.expiration?.[i] ?? 0,
        side: data.side?.[i] ?? "call",
        strike: data.strike?.[i] ?? 0,
        dte: data.dte?.[i] ?? null,
        firstTraded: data.firstTraded?.[i] ?? null,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: optionContracts.optionSymbol,
        set: {
          dte: data.dte?.[i] ?? null,
          updatedAt: now,
        },
      });
  }
}

export async function cacheStockBars(
  symbol: string,
  resolution: string,
  candles: {
    t: number[];
    o: number[];
    h: number[];
    l: number[];
    c: number[];
    v: number[];
  },
): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  const sym = symbol.toUpperCase();
  const now = new Date();
  const expiresAt = addSeconds(now, stockBarTtlSeconds());

  const rows = candles.t.map((barTime, i) => ({
    symbol: sym,
    resolution,
    barTime,
    open: candles.o[i],
    high: candles.h[i],
    low: candles.l[i],
    close: candles.c[i],
    volume: candles.v[i] ?? null,
    fetchedAt: now,
    expiresAt,
  }));

  for (const row of rows) {
    await db
      .insert(stockBars)
      .values(row)
      .onConflictDoUpdate({
        target: [
          stockBars.symbol,
          stockBars.resolution,
          stockBars.barTime,
        ],
        set: {
          open: row.open,
          high: row.high,
          low: row.low,
          close: row.close,
          volume: row.volume,
          fetchedAt: now,
          expiresAt,
        },
      });
  }
}

export async function getCachedStockBars(
  symbol: string,
  resolution: string,
  minBars: number,
): Promise<OHLCVBar[]> {
  const db = tryGetDb();
  if (!db) return [];

  const sym = symbol.toUpperCase();
  const rows = await db
    .select()
    .from(stockBars)
    .where(
      and(
        eq(stockBars.symbol, sym),
        eq(stockBars.resolution, resolution),
        gt(stockBars.expiresAt, new Date()),
      ),
    )
    .orderBy(stockBars.barTime);

  if (rows.length < minBars) return [];

  return rows.map((r) => ({
    time: r.barTime,
    open: r.open,
    high: r.high,
    low: r.low,
    close: r.close,
    volume: r.volume ?? 0,
  }));
}

export async function saveUnderlyingAnalysis(
  metrics: UnderlyingMetrics,
): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  await db.insert(underlyingAnalysis).values({
    symbol: metrics.symbol,
    price: metrics.price,
    return1d: metrics.return1d,
    return5d: metrics.return5d,
    return20d: metrics.return20d,
    sma20: metrics.sma20,
    sma50: metrics.sma50,
    sma200: metrics.sma200,
    ema9: metrics.ema9,
    ema20: metrics.ema20,
    ema50: metrics.ema50,
    ema200: metrics.ema200,
    rsi14: metrics.rsi14,
    atr14: metrics.atr14,
    historicalVolatility: metrics.historicalVolatility,
    volume: metrics.volume,
    relativeVolume: metrics.relativeVolume,
    recentHigh: metrics.recentHigh,
    recentLow: metrics.recentLow,
    support: metrics.support,
    resistance: metrics.resistance,
    distanceFromEma20: metrics.distanceFromEma20,
    distanceFromEma50: metrics.distanceFromEma50,
    distanceFromEma200: metrics.distanceFromEma200,
    classification: metrics.classification,
    metricsJson: metrics,
    analyzedAt: new Date(metrics.analyzedAt),
  });
}

export async function getLatestUnderlyingAnalysis(
  symbol: string,
): Promise<UnderlyingMetrics | null> {
  const db = tryGetDb();
  if (!db) return null;

  const sym = symbol.toUpperCase();
  const rows = await db
    .select()
    .from(underlyingAnalysis)
    .where(eq(underlyingAnalysis.symbol, sym))
    .orderBy(desc(underlyingAnalysis.analyzedAt))
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  if (row.metricsJson) return row.metricsJson as UnderlyingMetrics;

  return {
    symbol: row.symbol,
    price: row.price,
    return1d: row.return1d,
    return5d: row.return5d,
    return20d: row.return20d,
    sma20: row.sma20,
    sma50: row.sma50,
    sma200: row.sma200,
    ema9: row.ema9,
    ema20: row.ema20,
    ema50: row.ema50,
    ema200: row.ema200,
    rsi14: row.rsi14,
    atr14: row.atr14,
    historicalVolatility: row.historicalVolatility,
    volume: row.volume,
    relativeVolume: row.relativeVolume,
    recentHigh: row.recentHigh,
    recentLow: row.recentLow,
    support: row.support,
    resistance: row.resistance,
    distanceFromEma20: row.distanceFromEma20,
    distanceFromEma50: row.distanceFromEma50,
    distanceFromEma200: row.distanceFromEma200,
    classification: row.classification as UnderlyingMetrics["classification"],
    analyzedAt: row.analyzedAt.toISOString(),
  };
}

export async function getAllLatestUnderlyingAnalysis(): Promise<
  UnderlyingMetrics[]
> {
  const db = tryGetDb();
  if (!db) return [];

  // Get latest per symbol using distinct on symbol
  const rows = await db
    .select()
    .from(underlyingAnalysis)
    .orderBy(desc(underlyingAnalysis.analyzedAt));

  const seen = new Set<string>();
  const results: UnderlyingMetrics[] = [];

  for (const row of rows) {
    if (seen.has(row.symbol)) continue;
    seen.add(row.symbol);
    const m = row.metricsJson as UnderlyingMetrics | null;
    if (m) results.push(m);
  }

  return results;
}

export async function getCacheStats(): Promise<{
  databaseConnected: boolean;
  stockQuotesCached: number;
  optionQuotesCached: number;
  stockBarsCached: number;
  apiRequestsLast24h: number;
  apiCreditsLast24h: number;
  cacheHitsLast24h: number;
  pendingScanJobs: number;
}> {
  const db = tryGetDb();
  if (!db) {
    return {
      databaseConnected: false,
      stockQuotesCached: 0,
      optionQuotesCached: 0,
      stockBarsCached: 0,
      apiRequestsLast24h: 0,
      apiCreditsLast24h: 0,
      cacheHitsLast24h: 0,
      pendingScanJobs: 0,
    };
  }

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [sq, oq, sb, api, pending] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockQuotes)
      .where(gt(stockQuotes.expiresAt, new Date())),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(optionQuotes)
      .where(gt(optionQuotes.expiresAt, new Date())),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(stockBars)
      .where(gt(stockBars.expiresAt, new Date())),
    db
      .select({
        count: sql<number>`count(*)::int`,
        credits: sql<number>`coalesce(sum(${apiRequests.creditsEstimated}), 0)::int`,
        hits: sql<number>`coalesce(sum(case when ${apiRequests.cacheHit} then 1 else 0 end), 0)::int`,
      })
      .from(apiRequests)
      .where(gt(apiRequests.createdAt, since)),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(schema.scanQueue)
      .where(eq(schema.scanQueue.status, "pending")),
  ]);

  return {
    databaseConnected: true,
    stockQuotesCached: sq[0]?.count ?? 0,
    optionQuotesCached: oq[0]?.count ?? 0,
    stockBarsCached: sb[0]?.count ?? 0,
    apiRequestsLast24h: api[0]?.count ?? 0,
    apiCreditsLast24h: api[0]?.credits ?? 0,
    cacheHitsLast24h: api[0]?.hits ?? 0,
    pendingScanJobs: pending[0]?.count ?? 0,
  };
}

export async function purgeExpiredCache(): Promise<number> {
  const db = tryGetDb();
  if (!db) return 0;

  const now = new Date();
  const results = await Promise.all([
    db.delete(stockQuotes).where(sql`${stockQuotes.expiresAt} < ${now}`),
    db.delete(optionQuotes).where(sql`${optionQuotes.expiresAt} < ${now}`),
    db.delete(stockBars).where(sql`${stockBars.expiresAt} < ${now}`),
    db
      .delete(optionExpirationsCache)
      .where(sql`${optionExpirationsCache.expiresAt} < ${now}`),
    db
      .delete(optionChainCache)
      .where(sql`${optionChainCache.expiresAt} < ${now}`),
  ]);

  return results.reduce((sum, r) => sum + (r.rowCount ?? 0), 0);
}

// Re-export isExpired for tests
export { isExpired };
