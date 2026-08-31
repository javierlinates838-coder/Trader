import type { DataFreshness } from "@/types/marketdata";

const ET_TIMEZONE = "America/New_York";

/** US equity regular session: 9:30 AM – 4:00 PM ET, Mon–Fri */
export function isMarketOpen(now = new Date()): boolean {
  const et = new Intl.DateTimeFormat("en-US", {
    timeZone: ET_TIMEZONE,
    weekday: "short",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  }).formatToParts(now);

  const weekday = et.find((p) => p.type === "weekday")?.value ?? "";
  if (["Sat", "Sun"].includes(weekday)) return false;

  const hour = Number(et.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(et.find((p) => p.type === "minute")?.value ?? 0);
  const minutes = hour * 60 + minute;

  return minutes >= 9 * 60 + 30 && minutes < 16 * 60;
}

/**
 * Classify quote freshness based on timestamp age and market state.
 * MarketData.app free trial may return 15-min delayed or 1-day historical data.
 */
export function classifyDataFreshness(
  updatedUnix: number | null | undefined,
  now = new Date(),
): DataFreshness {
  if (!updatedUnix) return "STALE";

  const quoteTime = new Date(updatedUnix * 1000);
  const ageMinutes = (now.getTime() - quoteTime.getTime()) / 60_000;

  if (!isMarketOpen(now)) {
    // During closed hours, last session quote is expected
    if (ageMinutes > 24 * 60) return "STALE";
    return "MARKET_CLOSED";
  }

  if (ageMinutes <= 1) return "REALTIME";
  if (ageMinutes <= 20) return "DELAYED";
  return "STALE";
}

export function formatUnixEt(unix: number | null | undefined): string | null {
  if (!unix) return null;
  return new Date(unix * 1000).toLocaleString("en-US", {
    timeZone: ET_TIMEZONE,
    dateStyle: "medium",
    timeStyle: "medium",
  });
}

export function freshnessLabel(freshness: DataFreshness): string {
  switch (freshness) {
    case "REALTIME":
      return "REALTIME";
    case "DELAYED":
      return "DELAYED";
    case "STALE":
      return "STALE";
    case "MARKET_CLOSED":
      return "MARKET CLOSED";
  }
}

export function freshnessColor(freshness: DataFreshness): string {
  switch (freshness) {
    case "REALTIME":
      return "text-emerald-400";
    case "DELAYED":
      return "text-amber-400";
    case "STALE":
      return "text-red-400";
    case "MARKET_CLOSED":
      return "text-slate-400";
  }
}
