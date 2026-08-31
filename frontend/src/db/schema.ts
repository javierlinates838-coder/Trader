import {
  pgTable,
  serial,
  text,
  varchar,
  boolean,
  integer,
  bigint,
  real,
  doublePrecision,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/** Configurable scan universe */
export const symbols = pgTable(
  "symbols",
  {
    id: serial("id").primaryKey(),
    ticker: varchar("ticker", { length: 16 }).notNull(),
    name: text("name"),
    enabled: boolean("enabled").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("symbols_ticker_idx").on(t.ticker)],
);

/** Cached stock quotes — TTL 30s market hours */
export const stockQuotes = pgTable(
  "stock_quotes",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    bid: doublePrecision("bid"),
    ask: doublePrecision("ask"),
    mid: doublePrecision("mid"),
    last: doublePrecision("last"),
    volume: bigint("volume", { mode: "number" }),
    change: doublePrecision("change"),
    changePct: doublePrecision("change_pct"),
    quoteUpdated: integer("quote_updated"),
    rawJson: jsonb("raw_json"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("stock_quotes_symbol_idx").on(t.symbol),
    index("stock_quotes_expires_idx").on(t.expiresAt),
  ],
);

/** Cached OHLCV bars — TTL 1 hour daily */
export const stockBars = pgTable(
  "stock_bars",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    resolution: varchar("resolution", { length: 8 }).notNull().default("D"),
    barTime: integer("bar_time").notNull(),
    open: doublePrecision("open").notNull(),
    high: doublePrecision("high").notNull(),
    low: doublePrecision("low").notNull(),
    close: doublePrecision("close").notNull(),
    volume: bigint("volume", { mode: "number" }),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("stock_bars_symbol_res_time_idx").on(
      t.symbol,
      t.resolution,
      t.barTime,
    ),
    index("stock_bars_expires_idx").on(t.expiresAt),
  ],
);

/** Option contract metadata */
export const optionContracts = pgTable(
  "option_contracts",
  {
    id: serial("id").primaryKey(),
    optionSymbol: varchar("option_symbol", { length: 32 }).notNull(),
    underlying: varchar("underlying", { length: 16 }).notNull(),
    expiration: integer("expiration").notNull(),
    side: varchar("side", { length: 4 }).notNull(),
    strike: doublePrecision("strike").notNull(),
    dte: integer("dte"),
    firstTraded: integer("first_traded"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("option_contracts_symbol_idx").on(t.optionSymbol),
    index("option_contracts_underlying_idx").on(t.underlying),
  ],
);

/** Cached option quotes — TTL 60s per expiration chain */
export const optionQuotes = pgTable(
  "option_quotes",
  {
    id: serial("id").primaryKey(),
    optionSymbol: varchar("option_symbol", { length: 32 }).notNull(),
    underlying: varchar("underlying", { length: 16 }).notNull(),
    expiration: varchar("expiration", { length: 10 }),
    bid: doublePrecision("bid"),
    ask: doublePrecision("ask"),
    mid: doublePrecision("mid"),
    last: doublePrecision("last"),
    volume: integer("volume"),
    openInterest: integer("open_interest"),
    iv: doublePrecision("iv"),
    delta: doublePrecision("delta"),
    gamma: doublePrecision("gamma"),
    theta: doublePrecision("theta"),
    vega: doublePrecision("vega"),
    underlyingPrice: doublePrecision("underlying_price"),
    intrinsicValue: doublePrecision("intrinsic_value"),
    extrinsicValue: doublePrecision("extrinsic_value"),
    inTheMoney: boolean("in_the_money"),
    quoteUpdated: integer("quote_updated"),
    rawJson: jsonb("raw_json"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    index("option_quotes_symbol_idx").on(t.optionSymbol),
    index("option_quotes_underlying_exp_idx").on(t.underlying, t.expiration),
    index("option_quotes_expires_idx").on(t.expiresAt),
  ],
);

/** MarketData.app API request log for credit tracking */
export const apiRequests = pgTable(
  "api_requests",
  {
    id: serial("id").primaryKey(),
    endpoint: text("endpoint").notNull(),
    method: varchar("method", { length: 8 }).notNull().default("GET"),
    creditsEstimated: integer("credits_estimated").notNull().default(1),
    statusCode: integer("status_code"),
    cacheHit: boolean("cache_hit").notNull().default(false),
    error: text("error"),
    latencyMs: integer("latency_ms"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("api_requests_created_idx").on(t.createdAt)],
);

/** Scan job queue */
export const scanQueue = pgTable(
  "scan_queue",
  {
    id: serial("id").primaryKey(),
    jobType: varchar("job_type", { length: 64 }).notNull(),
    payload: jsonb("payload").notNull().default({}),
    status: varchar("status", { length: 16 }).notNull().default("pending"),
    priority: integer("priority").notNull().default(0),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    startedAt: timestamp("started_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    error: text("error"),
    result: jsonb("result"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("scan_queue_status_priority_idx").on(t.status, t.priority),
    index("scan_queue_scheduled_idx").on(t.scheduledAt),
  ],
);

/** Cached full option chains — TTL 60s */
export const optionChainCache = pgTable(
  "option_chain_cache",
  {
    id: serial("id").primaryKey(),
    cacheKey: varchar("cache_key", { length: 128 }).notNull(),
    underlying: varchar("underlying", { length: 16 }).notNull(),
    expiration: varchar("expiration", { length: 10 }),
    side: varchar("side", { length: 8 }),
    rangeFilter: varchar("range_filter", { length: 8 }),
    contractCount: integer("contract_count").notNull().default(0),
    chainJson: jsonb("chain_json").notNull(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("option_chain_cache_key_idx").on(t.cacheKey),
    index("option_chain_cache_expires_idx").on(t.expiresAt),
  ],
);

/** Cached expiration lists — TTL 15 min */
export const optionExpirationsCache = pgTable(
  "option_expirations_cache",
  {
    id: serial("id").primaryKey(),
    underlying: varchar("underlying", { length: 16 }).notNull(),
    expirations: jsonb("expirations").notNull(),
    updated: integer("updated"),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  },
  (t) => [
    uniqueIndex("option_expirations_underlying_idx").on(t.underlying),
  ],
);

/** Stored underlying technical analysis results */
export const underlyingAnalysis = pgTable(
  "underlying_analysis",
  {
    id: serial("id").primaryKey(),
    symbol: varchar("symbol", { length: 16 }).notNull(),
    price: doublePrecision("price").notNull(),
    return1d: doublePrecision("return_1d"),
    return5d: doublePrecision("return_5d"),
    return20d: doublePrecision("return_20d"),
    sma20: doublePrecision("sma_20"),
    sma50: doublePrecision("sma_50"),
    sma200: doublePrecision("sma_200"),
    ema9: doublePrecision("ema_9"),
    ema20: doublePrecision("ema_20"),
    ema50: doublePrecision("ema_50"),
    ema200: doublePrecision("ema_200"),
    rsi14: doublePrecision("rsi_14"),
    atr14: doublePrecision("atr_14"),
    historicalVolatility: doublePrecision("historical_volatility"),
    volume: bigint("volume", { mode: "number" }),
    relativeVolume: doublePrecision("relative_volume"),
    recentHigh: doublePrecision("recent_high"),
    recentLow: doublePrecision("recent_low"),
    support: doublePrecision("support"),
    resistance: doublePrecision("resistance"),
    distanceFromEma20: doublePrecision("distance_from_ema_20"),
    distanceFromEma50: doublePrecision("distance_from_ema_50"),
    distanceFromEma200: doublePrecision("distance_from_ema_200"),
    classification: varchar("classification", { length: 32 }).notNull(),
    metricsJson: jsonb("metrics_json"),
    analyzedAt: timestamp("analyzed_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("underlying_analysis_symbol_idx").on(t.symbol),
    index("underlying_analysis_analyzed_idx").on(t.analyzedAt),
  ],
);

/** App settings (risk limits, scan modes, etc.) */
export const settings = pgTable("settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type Symbol = typeof symbols.$inferSelect;
export type StockQuote = typeof stockQuotes.$inferSelect;
export type ScanQueueJob = typeof scanQueue.$inferSelect;
export type UnderlyingAnalysisRow = typeof underlyingAnalysis.$inferSelect;
