import { describe, it, expect } from "vitest";
import { sma, ema, rsi, atr, periodReturn, historicalVolatility } from "@/lib/indicators";
import { classifyUnderlying, computeUnderlyingMetrics } from "@/lib/underlying-classifier";
import type { OHLCVBar } from "@/types/underlying";

function makeBars(closes: number[]): OHLCVBar[] {
  return closes.map((close, i) => ({
    time: i,
    open: close - 0.5,
    high: close + 1,
    low: close - 1,
    close,
    volume: 1_000_000,
  }));
}

// Generate 250 bars of uptrending data
function uptrendBars(): OHLCVBar[] {
  const closes: number[] = [];
  let price = 100;
  for (let i = 0; i < 250; i++) {
    price += 0.3 + Math.sin(i / 10) * 0.1;
    closes.push(price);
  }
  return makeBars(closes);
}

describe("indicators", () => {
  it("sma calculates correctly", () => {
    expect(sma([1, 2, 3, 4, 5], 3)).toBe(4);
  });

  it("ema returns value for sufficient data", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + i);
    expect(ema(closes, 9)).not.toBeNull();
  });

  it("rsi returns 0-100 range", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + (i % 3));
    const val = rsi(closes, 14);
    expect(val).not.toBeNull();
    expect(val!).toBeGreaterThanOrEqual(0);
    expect(val!).toBeLessThanOrEqual(100);
  });

  it("periodReturn calculates 5-day return", () => {
    const closes = [100, 101, 102, 103, 104, 105];
    expect(periodReturn(closes, 5)).toBeCloseTo(0.05, 4);
  });

  it("atr returns positive value", () => {
    const bars = makeBars([100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114, 115]);
    expect(atr(bars, 14)).toBeGreaterThan(0);
  });

  it("historicalVolatility returns positive", () => {
    const closes = Array.from({ length: 30 }, (_, i) => 100 + Math.sin(i) * 2);
    expect(historicalVolatility(closes, 20)).toBeGreaterThan(0);
  });
});

describe("underlying-classifier", () => {
  it("classifies uptrend as bullish or strong bullish", () => {
    const bars = uptrendBars();
    const classification = classifyUnderlying(bars, bars[bars.length - 1].close);
    expect(["STRONG BULLISH", "BULLISH", "OVEREXTENDED"]).toContain(classification);
  });

  it("returns NO EDGE for insufficient data", () => {
    expect(classifyUnderlying(makeBars([100, 101]), 101)).toBe("NO EDGE");
  });

  it("computeUnderlyingMetrics returns all key fields", () => {
    const bars = uptrendBars();
    const metrics = computeUnderlyingMetrics("QQQ", bars);
    expect(metrics).not.toBeNull();
    expect(metrics!.symbol).toBe("QQQ");
    expect(metrics!.price).toBeGreaterThan(0);
    expect(metrics!.rsi14).not.toBeNull();
    expect(metrics!.classification).toBeTruthy();
  });
});
