/** Default liquid symbol universe — configurable via `symbols` table */
export const DEFAULT_SYMBOLS = [
  "SPY",
  "QQQ",
  "IWM",
  "DIA",
  "NVDA",
  "AAPL",
  "MSFT",
  "AMZN",
  "META",
  "GOOGL",
  "TSLA",
  "AMD",
  "AVGO",
  "NFLX",
  "PLTR",
  "COIN",
  "MSTR",
  "HOOD",
  "SOFI",
  "AAL",
  "DAL",
  "UAL",
  "CCL",
  "RCL",
  "XOM",
  "CVX",
  "SMH",
  "XLK",
  "XLE",
  "XLF",
  "TLT",
  "GLD",
  "SLV",
  "SQQQ",
  "TQQQ",
] as const;

/** Cache TTLs in seconds */
export const CACHE_TTL = {
  STOCK_QUOTE: 30,
  STOCK_BAR: 3600,
  OPTION_EXPIRATIONS: 900,
  OPTION_CHAIN: 60,
} as const;

/** Rate limit backoff settings */
export const RATE_LIMIT = {
  MAX_RETRIES: 4,
  BASE_DELAY_MS: 1000,
  MAX_DELAY_MS: 32000,
} as const;
