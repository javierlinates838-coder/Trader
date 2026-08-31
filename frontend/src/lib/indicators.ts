import type { OHLCVBar } from "@/types/underlying";

/** Simple moving average of the last `period` closes */
export function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(-period);
  return slice.reduce((a, b) => a + b, 0) / period;
}

/** Exponential moving average — returns series, last value is current EMA */
export function emaSeries(closes: number[], period: number): number[] {
  if (closes.length === 0) return [];
  const k = 2 / (period + 1);
  const result: number[] = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    result.push(closes[i] * k + result[i - 1] * (1 - k));
  }
  return result;
}

export function ema(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const series = emaSeries(closes, period);
  return series[series.length - 1];
}

/** RSI(14) using Wilder's smoothing */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;

  let avgGain = 0;
  let avgLoss = 0;

  for (let i = 1; i <= period; i++) {
    const change = closes[i] - closes[i - 1];
    if (change >= 0) avgGain += change;
    else avgLoss += Math.abs(change);
  }
  avgGain /= period;
  avgLoss /= period;

  for (let i = period + 1; i < closes.length; i++) {
    const change = closes[i] - closes[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

/** Average True Range(14) */
export function atr(bars: OHLCVBar[], period = 14): number | null {
  if (bars.length < period + 1) return null;

  const trueRanges: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].high;
    const low = bars[i].low;
    const prevClose = bars[i - 1].close;
    trueRanges.push(
      Math.max(high - low, Math.abs(high - prevClose), Math.abs(low - prevClose)),
    );
  }

  if (trueRanges.length < period) return null;

  let atrVal = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < trueRanges.length; i++) {
    atrVal = (atrVal * (period - 1) + trueRanges[i]) / period;
  }
  return atrVal;
}

/** Annualized historical volatility from log returns */
export function historicalVolatility(
  closes: number[],
  period = 20,
): number | null {
  if (closes.length < period + 1) return null;

  const logReturns: number[] = [];
  for (let i = closes.length - period; i < closes.length; i++) {
    if (closes[i - 1] > 0 && closes[i] > 0) {
      logReturns.push(Math.log(closes[i] / closes[i - 1]));
    }
  }

  if (logReturns.length < 2) return null;

  const mean = logReturns.reduce((a, b) => a + b, 0) / logReturns.length;
  const variance =
    logReturns.reduce((sum, r) => sum + (r - mean) ** 2, 0) /
    (logReturns.length - 1);
  return Math.sqrt(variance * 252);
}

/** N-day return as decimal (0.05 = 5%) */
export function periodReturn(closes: number[], days: number): number | null {
  if (closes.length < days + 1) return null;
  const current = closes[closes.length - 1];
  const past = closes[closes.length - 1 - days];
  if (past === 0) return null;
  return (current - past) / past;
}

/** Relative volume vs 20-day average */
export function relativeVolume(bars: OHLCVBar[], period = 20): number | null {
  if (bars.length < period) return null;
  const volumes = bars.slice(-period).map((b) => b.volume);
  const avg = volumes.slice(0, -1).reduce((a, b) => a + b, 0) / (period - 1);
  const current = volumes[volumes.length - 1];
  if (avg === 0) return null;
  return current / avg;
}

/** Distance from EMA as percentage of price */
export function distanceFromEma(
  price: number,
  emaVal: number | null,
): number | null {
  if (emaVal === null || price === 0) return null;
  return ((price - emaVal) / price) * 100;
}

/** Recent high/low over lookback bars */
export function recentHighLow(
  bars: OHLCVBar[],
  lookback = 20,
): { high: number; low: number } | null {
  if (bars.length < lookback) return null;
  const slice = bars.slice(-lookback);
  return {
    high: Math.max(...slice.map((b) => b.high)),
    low: Math.min(...slice.map((b) => b.low)),
  };
}

/** Simple support/resistance from recent swing low/high */
export function supportResistance(bars: OHLCVBar[], lookback = 50) {
  const hl = recentHighLow(bars, lookback);
  if (!hl) return { support: null, resistance: null };
  return { support: hl.low, resistance: hl.high };
}
