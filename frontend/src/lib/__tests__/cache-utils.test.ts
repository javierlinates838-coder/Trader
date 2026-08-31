import { describe, it, expect } from "vitest";
import {
  addSeconds,
  estimateCredits,
  isExpired,
  stockQuoteTtlSeconds,
} from "@/lib/cache-utils";

describe("cache-utils", () => {
  it("addSeconds adds correctly", () => {
    const d = new Date("2026-01-01T00:00:00Z");
    const result = addSeconds(d, 30);
    expect(result.getTime() - d.getTime()).toBe(30_000);
  });

  it("isExpired returns true for past dates", () => {
    expect(isExpired(new Date(Date.now() - 1000))).toBe(true);
    expect(isExpired(new Date(Date.now() + 60_000))).toBe(false);
  });

  it("estimateCredits for chain scales with contracts", () => {
    expect(estimateCredits("/options/chain/QQQ/", 100)).toBe(100);
    expect(estimateCredits("/stocks/quotes/QQQ/")).toBe(1);
  });

  it("stockQuoteTtlSeconds returns positive number", () => {
    expect(stockQuoteTtlSeconds()).toBeGreaterThan(0);
  });
});
