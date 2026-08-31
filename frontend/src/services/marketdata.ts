/**
 * MarketData.app API client — server-side only.
 * Docs: https://www.marketdata.app/docs/api/
 *
 * All requests use Bearer token authentication.
 * Never import this module from client components.
 */

import type {
  MarketDataHealth,
  NormalizedOptionContract,
  NormalizedStockQuote,
  OptionChainResponse,
  OptionExpirationsResponse,
  StockQuoteResponse,
} from "@/types/marketdata";
import {
  classifyDataFreshness,
  formatUnixEt,
} from "@/lib/data-freshness";

const BASE_URL = "https://api.marketdata.app/v1";

export class MarketDataError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly response?: unknown,
  ) {
    super(message);
    this.name = "MarketDataError";
  }
}

const DEMO_SYMBOLS = new Set(["AAPL"]);

function isDemoMode(): boolean {
  return process.env.DEMO_MODE === "true";
}

function getToken(): string | null {
  return process.env.MARKETDATA_TOKEN || null;
}

let lastSuccessfulRequest: Date | null = null;
let latestQuoteTimestamp: number | null = null;

async function marketDataFetch<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
  options?: { allowUnauthenticated?: boolean },
): Promise<T> {
  const token = getToken();
  const url = new URL(`${BASE_URL}${path}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const headers: Record<string, string> = {
    Accept: "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if (!options?.allowUnauthenticated) {
    throw new MarketDataError(
      "MARKETDATA_TOKEN is not configured. Add it to .env.local",
      401,
    );
  }

  const response = await fetch(url.toString(), {
    headers,
    cache: "no-store",
  });

  const data = (await response.json()) as T & { s?: string; errmsg?: string };

  if (!response.ok || data.s === "error") {
    throw new MarketDataError(
      data.errmsg ?? `MarketData API error: HTTP ${response.status}`,
      response.status,
      data,
    );
  }

  lastSuccessfulRequest = new Date();
  return data;
}

function canUseUnauthenticated(symbol: string): boolean {
  return isDemoMode() && DEMO_SYMBOLS.has(symbol.toUpperCase());
}

/** GET /v1/stocks/quotes/{symbol}/ */
export async function getStockQuote(
  symbol: string,
): Promise<StockQuoteResponse> {
  const sym = symbol.toUpperCase();
  const data = await marketDataFetch<StockQuoteResponse>(
    `/stocks/quotes/${sym}/`,
    undefined,
    { allowUnauthenticated: canUseUnauthenticated(sym) },
  );

  if (data.updated?.[0]) {
    latestQuoteTimestamp = data.updated[0];
  }

  return data;
}

/** GET /v1/options/expirations/{underlyingSymbol}/ */
export async function getOptionExpirations(
  underlying: string,
): Promise<OptionExpirationsResponse> {
  const sym = underlying.toUpperCase();
  return marketDataFetch<OptionExpirationsResponse>(
    `/options/expirations/${sym}/`,
    undefined,
    { allowUnauthenticated: canUseUnauthenticated(sym) },
  );
}

export interface OptionChainParams {
  expiration?: string;
  side?: "call" | "put";
  dte?: number;
  from?: string;
  to?: string;
  strike?: number;
  delta?: number;
  range?: "itm" | "otm" | "atm" | "all";
}

/** GET /v1/options/chain/{underlyingSymbol}/ */
export async function getOptionChain(
  underlying: string,
  params?: OptionChainParams,
): Promise<OptionChainResponse> {
  const sym = underlying.toUpperCase();
  const data = await marketDataFetch<OptionChainResponse>(
    `/options/chain/${sym}/`,
    params as Record<string, string | number | boolean | undefined>,
    { allowUnauthenticated: canUseUnauthenticated(sym) },
  );

  if (data.updated?.[0]) {
    latestQuoteTimestamp = data.updated[0];
  }

  return data;
}

/** GET /v1/stocks/candles/{resolution}/{symbol}/ */
export async function getStockCandles(
  symbol: string,
  resolution: string = "D",
  params?: { from?: string; to?: string; countback?: number },
) {
  return marketDataFetch(
    `/stocks/candles/${resolution}/${symbol.toUpperCase()}/`,
    params,
  );
}

export function normalizeStockQuote(
  data: StockQuoteResponse,
  index = 0,
): NormalizedStockQuote {
  return {
    symbol: data.symbol?.[index] ?? "",
    bid: data.bid?.[index] ?? null,
    ask: data.ask?.[index] ?? null,
    mid: data.mid?.[index] ?? null,
    last: data.last?.[index] ?? null,
    volume: data.volume?.[index] ?? null,
    change: data.change?.[index] ?? null,
    changePct: data.changepct?.[index] ?? null,
    updated: data.updated?.[index] ?? null,
    updatedIso: formatUnixEt(data.updated?.[index]),
  };
}

export function normalizeOptionChain(
  data: OptionChainResponse,
): NormalizedOptionContract[] {
  if (!data.optionSymbol?.length) return [];

  return data.optionSymbol.map((symbol, i) => {
    const bid = data.bid?.[i] ?? null;
    const ask = data.ask?.[i] ?? null;
    const mid =
      data.mid?.[i] ??
      (bid !== null && ask !== null ? (bid + ask) / 2 : null);
    const theta = data.theta?.[i] ?? null;

    const spreadPercent =
      bid !== null && ask !== null && mid && mid > 0
        ? ((ask - bid) / mid) * 100
        : null;

    const thetaBurnPercent =
      theta !== null && mid && mid > 0
        ? (Math.abs(theta) / mid) * 100
        : null;

    const expiration = data.expiration?.[i] ?? 0;

    return {
      optionSymbol: symbol,
      underlying: data.underlying?.[i] ?? "",
      expiration,
      expirationIso: expiration
        ? new Date(expiration * 1000).toISOString().split("T")[0]
        : "",
      side: (data.side?.[i] ?? "call") as "call" | "put",
      strike: data.strike?.[i] ?? 0,
      dte: data.dte?.[i] ?? 0,
      bid,
      ask,
      mid,
      last: data.last?.[i] ?? null,
      volume: data.volume?.[i] ?? null,
      openInterest: data.openInterest?.[i] ?? null,
      underlyingPrice: data.underlyingPrice?.[i] ?? null,
      iv: data.iv?.[i] ?? null,
      delta: data.delta?.[i] ?? null,
      gamma: data.gamma?.[i] ?? null,
      theta,
      vega: data.vega?.[i] ?? null,
      intrinsicValue: data.intrinsicValue?.[i] ?? null,
      extrinsicValue: data.extrinsicValue?.[i] ?? null,
      inTheMoney: data.inTheMoney?.[i] ?? false,
      updated: data.updated?.[i] ?? null,
      updatedIso: formatUnixEt(data.updated?.[i]),
      spreadPercent,
      thetaBurnPercent,
    };
  });
}

export function getMarketDataHealth(): MarketDataHealth {
  const freshness = classifyDataFreshness(latestQuoteTimestamp);

  return {
    connected: lastSuccessfulRequest !== null,
    lastSuccessfulRequest: lastSuccessfulRequest?.toISOString() ?? null,
    latestQuoteTimestamp: formatUnixEt(latestQuoteTimestamp),
    dataFreshness: freshness,
    error: null,
  };
}

export function getConnectionMode(): "authenticated" | "demo" | "unconfigured" {
  if (getToken()) return "authenticated";
  if (isDemoMode()) return "demo";
  return "unconfigured";
}

/** Run connectivity test: quote + expirations + chain for a symbol */
export async function runDiagnostics(symbol: string = "QQQ") {
  const connectionMode = getConnectionMode();

  if (connectionMode === "unconfigured") {
    return {
      health: {
        connected: false,
        lastSuccessfulRequest: null,
        latestQuoteTimestamp: null,
        dataFreshness: "STALE" as const,
        error:
          "MARKETDATA_TOKEN is not configured. Add it to frontend/.env.local",
      },
      symbol,
      connectionMode,
      error: "MARKET DATA NOT CONNECTED",
    };
  }

  if (connectionMode === "demo" && !DEMO_SYMBOLS.has(symbol.toUpperCase())) {
    return {
      health: {
        connected: false,
        lastSuccessfulRequest: null,
        latestQuoteTimestamp: null,
        dataFreshness: "STALE" as const,
        error: `DEMO_MODE only supports ${[...DEMO_SYMBOLS].join(", ")}. Add MARKETDATA_TOKEN for ${symbol}.`,
      },
      symbol,
      connectionMode,
      error: `DEMO_MODE only supports ${[...DEMO_SYMBOLS].join(", ")}`,
    };
  }
  const health: MarketDataHealth = {
    connected: false,
    lastSuccessfulRequest: null,
    latestQuoteTimestamp: null,
    dataFreshness: "STALE",
    error: null,
  };

  try {
    const quote = await getStockQuote(symbol);
    const normalizedQuote = normalizeStockQuote(quote);

    const expirations = await getOptionExpirations(symbol);

    // Pick nearest expiration with 3-30 DTE if available
    const today = new Date();
    const validExpirations = (expirations.expirations ?? []).filter((exp) => {
      const dte = Math.ceil(
        (new Date(exp).getTime() - today.getTime()) / 86_400_000,
      );
      return dte >= 3 && dte <= 30;
    });

    const targetExpiration =
      validExpirations[0] ?? expirations.expirations?.[0];

    let chain: OptionChainResponse | null = null;
    let normalizedChain: NormalizedOptionContract[] = [];

    if (targetExpiration) {
      chain = await getOptionChain(symbol, {
        expiration: targetExpiration,
        side: "put",
        range: "atm",
      });
      normalizedChain = normalizeOptionChain(chain);
    }

    health.connected = true;
    health.lastSuccessfulRequest = lastSuccessfulRequest?.toISOString() ?? null;
    health.latestQuoteTimestamp = formatUnixEt(latestQuoteTimestamp);
    health.dataFreshness = classifyDataFreshness(latestQuoteTimestamp);

    return {
      health,
      symbol,
      connectionMode,
      quote,
      normalizedQuote,
      expirations,
      targetExpiration,
      chain,
      normalizedChain: normalizedChain.slice(0, 10),
      chainContractCount: chain?.optionSymbol?.length ?? 0,
    };
  } catch (err) {
    health.error =
      err instanceof MarketDataError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown error";
    return { health, symbol, connectionMode, error: health.error };
  }
}
