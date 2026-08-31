CREATE TABLE IF NOT EXISTS "symbols" (
  "id" serial PRIMARY KEY NOT NULL,
  "ticker" varchar(16) NOT NULL,
  "name" text,
  "enabled" boolean DEFAULT true NOT NULL,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "symbols_ticker_idx" ON "symbols" ("ticker");

CREATE TABLE IF NOT EXISTS "stock_quotes" (
  "id" serial PRIMARY KEY NOT NULL,
  "symbol" varchar(16) NOT NULL,
  "bid" double precision,
  "ask" double precision,
  "mid" double precision,
  "last" double precision,
  "volume" bigint,
  "change" double precision,
  "change_pct" double precision,
  "quote_updated" integer,
  "raw_json" jsonb,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "stock_quotes_symbol_idx" ON "stock_quotes" ("symbol");
CREATE INDEX IF NOT EXISTS "stock_quotes_expires_idx" ON "stock_quotes" ("expires_at");

CREATE TABLE IF NOT EXISTS "stock_bars" (
  "id" serial PRIMARY KEY NOT NULL,
  "symbol" varchar(16) NOT NULL,
  "resolution" varchar(8) DEFAULT 'D' NOT NULL,
  "bar_time" integer NOT NULL,
  "open" double precision NOT NULL,
  "high" double precision NOT NULL,
  "low" double precision NOT NULL,
  "close" double precision NOT NULL,
  "volume" bigint,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "stock_bars_symbol_res_time_idx" ON "stock_bars" ("symbol","resolution","bar_time");
CREATE INDEX IF NOT EXISTS "stock_bars_expires_idx" ON "stock_bars" ("expires_at");

CREATE TABLE IF NOT EXISTS "option_contracts" (
  "id" serial PRIMARY KEY NOT NULL,
  "option_symbol" varchar(32) NOT NULL,
  "underlying" varchar(16) NOT NULL,
  "expiration" integer NOT NULL,
  "side" varchar(4) NOT NULL,
  "strike" double precision NOT NULL,
  "dte" integer,
  "first_traded" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "option_contracts_symbol_idx" ON "option_contracts" ("option_symbol");
CREATE INDEX IF NOT EXISTS "option_contracts_underlying_idx" ON "option_contracts" ("underlying");

CREATE TABLE IF NOT EXISTS "option_quotes" (
  "id" serial PRIMARY KEY NOT NULL,
  "option_symbol" varchar(32) NOT NULL,
  "underlying" varchar(16) NOT NULL,
  "expiration" varchar(10),
  "bid" double precision,
  "ask" double precision,
  "mid" double precision,
  "last" double precision,
  "volume" integer,
  "open_interest" integer,
  "iv" double precision,
  "delta" double precision,
  "gamma" double precision,
  "theta" double precision,
  "vega" double precision,
  "underlying_price" double precision,
  "intrinsic_value" double precision,
  "extrinsic_value" double precision,
  "in_the_money" boolean,
  "quote_updated" integer,
  "raw_json" jsonb,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE INDEX IF NOT EXISTS "option_quotes_symbol_idx" ON "option_quotes" ("option_symbol");
CREATE INDEX IF NOT EXISTS "option_quotes_underlying_exp_idx" ON "option_quotes" ("underlying","expiration");
CREATE INDEX IF NOT EXISTS "option_quotes_expires_idx" ON "option_quotes" ("expires_at");

CREATE TABLE IF NOT EXISTS "option_chain_cache" (
  "id" serial PRIMARY KEY NOT NULL,
  "cache_key" varchar(128) NOT NULL,
  "underlying" varchar(16) NOT NULL,
  "expiration" varchar(10),
  "side" varchar(8),
  "range_filter" varchar(8),
  "contract_count" integer DEFAULT 0 NOT NULL,
  "chain_json" jsonb NOT NULL,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "option_chain_cache_key_idx" ON "option_chain_cache" ("cache_key");
CREATE INDEX IF NOT EXISTS "option_chain_cache_expires_idx" ON "option_chain_cache" ("expires_at");

CREATE TABLE IF NOT EXISTS "option_expirations_cache" (
  "id" serial PRIMARY KEY NOT NULL,
  "underlying" varchar(16) NOT NULL,
  "expirations" jsonb NOT NULL,
  "updated" integer,
  "fetched_at" timestamp with time zone DEFAULT now() NOT NULL,
  "expires_at" timestamp with time zone NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "option_expirations_underlying_idx" ON "option_expirations_cache" ("underlying");

CREATE TABLE IF NOT EXISTS "api_requests" (
  "id" serial PRIMARY KEY NOT NULL,
  "endpoint" text NOT NULL,
  "method" varchar(8) DEFAULT 'GET' NOT NULL,
  "credits_estimated" integer DEFAULT 1 NOT NULL,
  "status_code" integer,
  "cache_hit" boolean DEFAULT false NOT NULL,
  "error" text,
  "latency_ms" integer,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "api_requests_created_idx" ON "api_requests" ("created_at");

CREATE TABLE IF NOT EXISTS "scan_queue" (
  "id" serial PRIMARY KEY NOT NULL,
  "job_type" varchar(64) NOT NULL,
  "payload" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "status" varchar(16) DEFAULT 'pending' NOT NULL,
  "priority" integer DEFAULT 0 NOT NULL,
  "scheduled_at" timestamp with time zone DEFAULT now() NOT NULL,
  "started_at" timestamp with time zone,
  "completed_at" timestamp with time zone,
  "error" text,
  "result" jsonb,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "scan_queue_status_priority_idx" ON "scan_queue" ("status","priority");
CREATE INDEX IF NOT EXISTS "scan_queue_scheduled_idx" ON "scan_queue" ("scheduled_at");

CREATE TABLE IF NOT EXISTS "settings" (
  "key" varchar(64) PRIMARY KEY NOT NULL,
  "value" jsonb NOT NULL,
  "updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
