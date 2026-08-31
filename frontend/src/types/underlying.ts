export type UnderlyingClassification =
  | "STRONG BULLISH"
  | "BULLISH"
  | "NEUTRAL"
  | "BEARISH"
  | "STRONG BEARISH"
  | "OVEREXTENDED"
  | "NO EDGE";

export interface OHLCVBar {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface UnderlyingMetrics {
  symbol: string;
  price: number;
  return1d: number | null;
  return5d: number | null;
  return20d: number | null;
  sma20: number | null;
  sma50: number | null;
  sma200: number | null;
  ema9: number | null;
  ema20: number | null;
  ema50: number | null;
  ema200: number | null;
  rsi14: number | null;
  atr14: number | null;
  historicalVolatility: number | null;
  volume: number | null;
  relativeVolume: number | null;
  recentHigh: number | null;
  recentLow: number | null;
  support: number | null;
  resistance: number | null;
  distanceFromEma20: number | null;
  distanceFromEma50: number | null;
  distanceFromEma200: number | null;
  classification: UnderlyingClassification;
  analyzedAt: string;
}
