import type { OHLCVBar } from "@/types/underlying";
import type { UnderlyingMetrics } from "@/types/underlying";
import { computeUnderlyingMetrics } from "@/lib/underlying-classifier";
import { getStockCandles } from "@/services/marketdata";
import {
  cacheStockBars,
  getCachedStockBars,
  saveUnderlyingAnalysis,
  getLatestUnderlyingAnalysis,
} from "@/services/cache";
import { getEnabledSymbols } from "@/services/symbols";

export interface CandleResponse {
  s: string;
  t?: number[];
  o?: number[];
  h?: number[];
  l?: number[];
  c?: number[];
  v?: number[];
}

function toBars(data: CandleResponse): OHLCVBar[] {
  if (!data.t?.length) return [];
  return data.t.map((time, i) => ({
    time,
    open: data.o?.[i] ?? 0,
    high: data.h?.[i] ?? 0,
    low: data.l?.[i] ?? 0,
    close: data.c?.[i] ?? 0,
    volume: data.v?.[i] ?? 0,
  }));
}

/** Fetch daily candles with DB cache — needs 220 bars for SMA200 */
export async function fetchDailyBars(
  symbol: string,
  countback = 250,
): Promise<OHLCVBar[]> {
  const sym = symbol.toUpperCase();

  const cached = await getCachedStockBars(sym, "D", countback);
  if (cached.length >= 200) return cached;

  const data = (await getStockCandles(sym, "D", {
    countback,
  })) as CandleResponse;

  if (data.s !== "ok" || !data.t?.length) return cached;

  const bars = toBars(data);
  await cacheStockBars(sym, "D", {
    t: data.t,
    o: data.o ?? [],
    h: data.h ?? [],
    l: data.l ?? [],
    c: data.c ?? [],
    v: data.v ?? [],
  });

  return bars;
}

/** Analyze a single symbol */
export async function analyzeSymbol(
  symbol: string,
): Promise<UnderlyingMetrics | null> {
  const bars = await fetchDailyBars(symbol);
  const metrics = computeUnderlyingMetrics(symbol, bars);
  if (metrics) {
    await saveUnderlyingAnalysis(metrics);
  }
  return metrics;
}

/** Analyze full enabled universe */
export async function analyzeUniverse(): Promise<{
  analyzed: number;
  failed: string[];
  results: UnderlyingMetrics[];
}> {
  const symbols = await getEnabledSymbols();
  const results: UnderlyingMetrics[] = [];
  const failed: string[] = [];

  for (const symbol of symbols) {
    try {
      const metrics = await analyzeSymbol(symbol);
      if (metrics) results.push(metrics);
      else failed.push(symbol);
    } catch {
      failed.push(symbol);
    }
  }

  return { analyzed: results.length, failed, results };
}

export async function getSymbolAnalysis(
  symbol: string,
): Promise<UnderlyingMetrics | null> {
  const cached = await getLatestUnderlyingAnalysis(symbol);
  if (cached) return cached;
  return analyzeSymbol(symbol);
}
