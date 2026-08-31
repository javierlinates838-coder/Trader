import type {
  UnderlyingClassification,
  UnderlyingMetrics,
  OHLCVBar,
} from "@/types/underlying";
import {
  sma,
  ema,
  rsi,
  atr,
  historicalVolatility,
  periodReturn,
  relativeVolume,
  distanceFromEma,
  supportResistance,
  recentHighLow,
} from "@/lib/indicators";

export function classifyUnderlying(
  bars: OHLCVBar[],
  price: number,
): UnderlyingClassification {
  if (bars.length < 50) return "NO EDGE";

  const closes = bars.map((b) => b.close);
  const rsi14 = rsi(closes, 14);
  const ema20 = ema(closes, 20);
  const ema50 = ema(closes, 50);
  const ema200 = ema(closes, 200);
  const return5d = periodReturn(closes, 5);
  const return20d = periodReturn(closes, 20);
  const relVol = relativeVolume(bars, 20);
  const atr14 = atr(bars, 14);
  const distEma20 = distanceFromEma(price, ema20);

  if (rsi14 === null || ema20 === null) return "NO EDGE";

  // Flat / low conviction
  if (
    relVol !== null &&
    relVol < 0.5 &&
    return5d !== null &&
    Math.abs(return5d) < 0.01
  ) {
    return "NO EDGE";
  }

  // Overextended: extreme RSI or stretched from EMA20
  if (rsi14 > 75 || rsi14 < 25) return "OVEREXTENDED";
  if (
    distEma20 !== null &&
    atr14 !== null &&
    price > 0 &&
    Math.abs(distEma20) > ((atr14 / price) * 100 * 2.5)
  ) {
    return "OVEREXTENDED";
  }

  // Strong bullish: aligned EMAs + positive momentum
  if (
    ema50 !== null &&
    ema200 !== null &&
    price > ema20 &&
    ema20 > ema50 &&
    ema50 > ema200 &&
    return5d !== null &&
    return20d !== null &&
    return5d > 0 &&
    return20d > 0 &&
    rsi14 >= 50 &&
    rsi14 <= 72
  ) {
    return "STRONG BULLISH";
  }

  // Strong bearish: aligned EMAs + negative momentum
  if (
    ema50 !== null &&
    ema200 !== null &&
    price < ema20 &&
    ema20 < ema50 &&
    ema50 < ema200 &&
    return5d !== null &&
    return20d !== null &&
    return5d < 0 &&
    return20d < 0 &&
    rsi14 >= 28 &&
    rsi14 <= 50
  ) {
    return "STRONG BEARISH";
  }

  // Moderate bullish
  if (
    price > ema20 &&
    return5d !== null &&
    return5d > 0 &&
    rsi14 >= 45 &&
    rsi14 <= 65
  ) {
    return "BULLISH";
  }

  // Moderate bearish
  if (
    price < ema20 &&
    return5d !== null &&
    return5d < 0 &&
    rsi14 >= 35 &&
    rsi14 <= 55
  ) {
    return "BEARISH";
  }

  // Neutral: range-bound
  if (
    return5d !== null &&
    Math.abs(return5d) < 0.02 &&
    rsi14 >= 42 &&
    rsi14 <= 58
  ) {
    return "NEUTRAL";
  }

  return "NO EDGE";
}

export function computeUnderlyingMetrics(
  symbol: string,
  bars: OHLCVBar[],
): UnderlyingMetrics | null {
  if (bars.length < 20) return null;

  const closes = bars.map((b) => b.close);
  const price = closes[closes.length - 1];
  const { support, resistance } = supportResistance(bars, 50);
  const hl = recentHighLow(bars, 20);
  const ema20Val = ema(closes, 20);
  const ema50Val = ema(closes, 50);
  const ema200Val = ema(closes, 200);

  return {
    symbol: symbol.toUpperCase(),
    price,
    return1d: periodReturn(closes, 1),
    return5d: periodReturn(closes, 5),
    return20d: periodReturn(closes, 20),
    sma20: sma(closes, 20),
    sma50: sma(closes, 50),
    sma200: sma(closes, 200),
    ema9: ema(closes, 9),
    ema20: ema20Val,
    ema50: ema50Val,
    ema200: ema200Val,
    rsi14: rsi(closes, 14),
    atr14: atr(bars, 14),
    historicalVolatility: historicalVolatility(closes, 20),
    volume: bars[bars.length - 1]?.volume ?? null,
    relativeVolume: relativeVolume(bars, 20),
    recentHigh: hl?.high ?? null,
    recentLow: hl?.low ?? null,
    support,
    resistance,
    distanceFromEma20: distanceFromEma(price, ema20Val),
    distanceFromEma50: distanceFromEma(price, ema50Val),
    distanceFromEma200: distanceFromEma(price, ema200Val),
    classification: classifyUnderlying(bars, price),
    analyzedAt: new Date().toISOString(),
  };
}
