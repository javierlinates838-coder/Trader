# OPTION1 Roadmap

## Phase 1: MarketData Connection ✅

- [x] Project scaffolding (Next.js + FastAPI structure)
- [x] `.env.example` with `MARKETDATA_TOKEN`
- [x] MarketData.app service (TypeScript + Python)
- [x] API authentication test
- [x] Fetch QQQ stock quote
- [x] Fetch QQQ option expirations
- [x] Fetch QQQ option chain
- [x] Diagnostic page with raw API data
- [x] Field source analysis (API vs calculated)
- [x] Data freshness classification
- [x] Architecture documentation

## Phase 2: Database & Caching ✅

- [x] PostgreSQL schema with Drizzle ORM (Neon / Vercel Postgres)
- [x] Tables: symbols, stock_quotes, stock_bars, option_contracts, option_quotes, option_chain_cache, api_requests, scan_queue, settings
- [x] Quote/candle/chain caching with TTL
- [x] API credit tracking and rate limit handling
- [x] Scan queue infrastructure
- [x] Vercel deployment configuration

## Phase 3: Underlying Engine (Module 1) ✅ (Current)

- [x] Daily candle fetching for universe symbols (cached)
- [x] SMA (20/50/200), EMA (9/20/50/200)
- [x] RSI(14), ATR(14), historical volatility
- [x] Relative volume, support/resistance
- [x] Underlying classification (7 states)
- [x] `/underlying` dashboard + API routes
- [x] Unit tests for indicators and classification

## Phase 4: Option Pipeline (Modules 2–6)

- [ ] DTE and liquidity filters
- [ ] Spread %, OI, volume scoring
- [ ] IV vs realized vol analysis
- [ ] Greeks storage + theta burn %
- [ ] Expected move calculation
- [ ] Scan funnel statistics

## Phase 5: Probability & Simulation (Modules 7–9)

- [ ] Statistical probability model (no ML)
- [ ] Monte Carlo engine (10,000 paths)
- [ ] Black-Scholes repricing with IV scenarios
- [ ] SQQQ special compounding logic
- [ ] Unit tests: BS, Monte Carlo, SQQQ

## Phase 6: Scoring & Ranking (Modules 10–14)

- [ ] Raw EV and Conservative EV
- [ ] Contract comparison across strikes/expirations
- [ ] OPTION1 Score (0–100)
- [ ] Hard pass rules
- [ ] No chase detection
- [ ] Scan modes (6 modes)
- [ ] Unit tests: EV, conservative EV, scoring

## Phase 7: Dashboard UI

- [ ] Main scanner dashboard with sortable table
- [ ] Market status panel
- [ ] Scan funnel display
- [ ] Trade details page with simulation chart
- [ ] Risk settings (account balance, max risk %)
- [ ] Price filter
- [ ] Mobile responsive design

## Phase 8: Paper Trading

- [ ] Paper buy flow
- [ ] Position tracking (P/L, max gain, drawdown)
- [ ] Trade history

## Phase 9: Production Hardening

- [ ] Error handling for all API failure modes
- [ ] Comprehensive test suite
- [ ] Performance optimization (scan queue, parallel fetching)
- [ ] Deployment configuration
- [ ] Monitoring and logging

## Non-Goals (Current)

- Live trading integration
- Machine learning models
- Full market scan (entire US options market)
- Multiple data providers
