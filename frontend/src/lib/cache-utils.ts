import { isMarketOpen } from "@/lib/data-freshness";
import { CACHE_TTL } from "@/lib/constants";

export function addSeconds(date: Date, seconds: number): Date {
  return new Date(date.getTime() + seconds * 1000);
}

export function stockQuoteTtlSeconds(): number {
  // Shorter TTL during market hours; longer when closed
  return isMarketOpen() ? CACHE_TTL.STOCK_QUOTE : CACHE_TTL.STOCK_QUOTE * 10;
}

export function stockBarTtlSeconds(): number {
  return CACHE_TTL.STOCK_BAR;
}

export function optionExpirationsTtlSeconds(): number {
  return CACHE_TTL.OPTION_EXPIRATIONS;
}

export function optionChainTtlSeconds(): number {
  return isMarketOpen()
    ? CACHE_TTL.OPTION_CHAIN
    : CACHE_TTL.OPTION_CHAIN * 10;
}

export function isExpired(expiresAt: Date | string | null): boolean {
  if (!expiresAt) return true;
  return new Date(expiresAt).getTime() <= Date.now();
}

export async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function estimateCredits(
  endpoint: string,
  contractCount = 1,
): number {
  if (endpoint.includes("/options/chain/")) return contractCount;
  if (endpoint.includes("/options/quotes/")) return 1;
  if (endpoint.includes("/stocks/quotes")) return 1;
  if (endpoint.includes("/options/expirations/")) return 1;
  if (endpoint.includes("/stocks/candles/")) return 1;
  return 1;
}
