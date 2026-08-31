/** MarketData.app API response types — columnar array format */

export type MarketDataStatus = "ok" | "no_data" | "error";

export type DataFreshness = "REALTIME" | "DELAYED" | "STALE" | "MARKET_CLOSED";

export interface MarketDataBaseResponse {
  s: MarketDataStatus;
  errmsg?: string;
}

export interface StockQuoteResponse extends MarketDataBaseResponse {
  symbol?: string[];
  ask?: (number | null)[];
  askSize?: (number | null)[];
  bid?: (number | null)[];
  bidSize?: (number | null)[];
  mid?: (number | null)[];
  last?: (number | null)[];
  change?: (number | null)[];
  changepct?: (number | null)[];
  volume?: (number | null)[];
  updated?: (number | null)[];
  "52weekHigh"?: (number | null)[];
  "52weekLow"?: (number | null)[];
}

export interface OptionExpirationsResponse extends MarketDataBaseResponse {
  expirations?: string[];
  updated?: number;
  nextTime?: number;
  prevTime?: number;
}

export interface OptionChainResponse extends MarketDataBaseResponse {
  optionSymbol?: string[];
  underlying?: string[];
  expiration?: number[];
  side?: string[];
  strike?: number[];
  firstTraded?: number[];
  dte?: number[];
  updated?: number[];
  bid?: (number | null)[];
  bidSize?: (number | null)[];
  mid?: (number | null)[];
  ask?: (number | null)[];
  askSize?: (number | null)[];
  last?: (number | null)[];
  openInterest?: (number | null)[];
  volume?: (number | null)[];
  inTheMoney?: boolean[];
  intrinsicValue?: (number | null)[];
  extrinsicValue?: (number | null)[];
  underlyingPrice?: (number | null)[];
  iv?: (number | null)[];
  delta?: (number | null)[];
  gamma?: (number | null)[];
  theta?: (number | null)[];
  vega?: (number | null)[];
}

export interface NormalizedStockQuote {
  symbol: string;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  last: number | null;
  volume: number | null;
  change: number | null;
  changePct: number | null;
  updated: number | null;
  updatedIso: string | null;
}

export interface NormalizedOptionContract {
  optionSymbol: string;
  underlying: string;
  expiration: number;
  expirationIso: string;
  side: "call" | "put";
  strike: number;
  dte: number;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  last: number | null;
  volume: number | null;
  openInterest: number | null;
  underlyingPrice: number | null;
  iv: number | null;
  delta: number | null;
  gamma: number | null;
  theta: number | null;
  vega: number | null;
  intrinsicValue: number | null;
  extrinsicValue: number | null;
  inTheMoney: boolean;
  updated: number | null;
  updatedIso: string | null;
  spreadPercent: number | null;
  thetaBurnPercent: number | null;
}

export interface MarketDataHealth {
  connected: boolean;
  lastSuccessfulRequest: string | null;
  latestQuoteTimestamp: string | null;
  dataFreshness: DataFreshness;
  error: string | null;
}
