# OPTION1 Architecture

## Overview

OPTION1 is a full-stack options value scanner that finds the best value option trades using real market data from MarketData.app and transparent quantitative models.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (React)                            │
│  Dashboard · Trade Details · Paper Trading · Risk Settings      │
└──────────────────────────┬──────────────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────────────┐
│                   Next.js Frontend (Port 3000)                   │
│  · Server Components + API Routes (token proxy)                  │
│  · shadcn/ui + Tailwind dark terminal theme                      │
│  · Lightweight Charts / Recharts for simulation histograms       │
└──────────────────────────┬──────────────────────────────────────┘
                           │ Internal HTTP
┌──────────────────────────▼──────────────────────────────────────┐
│                FastAPI Backend (Port 8000)                         │
│  · Scan queue & pipeline orchestration                           │
│  · Underlying engine (pandas/numpy)                              │
│  · Monte Carlo + Black-Scholes (scipy/py_vollib)                 │
│  · EV scoring & ranking                                          │
└──────────┬───────────────────────────────┬──────────────────────┘
           │                               │
┌──────────▼──────────┐         ┌──────────▼──────────┐
│   PostgreSQL         │         │  MarketData.app API  │
│  · Quotes cache      │         │  (ONLY data source)  │
│  · Scan runs         │         │  Bearer token auth   │
│  · Paper trades      │         └─────────────────────┘
└─────────────────────┘
```

## Design Principles

1. **Accuracy over quantity** — scan a curated universe of ~36 liquid symbols, not the entire market
2. **No fake data** — if MarketData.app is unavailable, show "MARKET DATA NOT CONNECTED"
3. **Server-side API calls only** — `MARKETDATA_TOKEN` never reaches the browser
4. **Transparent models** — every score traceable to API fields + documented formulas
5. **Pipeline efficiency** — cheap filters before expensive Monte Carlo (saves API credits)

## Scan Pipeline

```
ALL CONTRACTS
    ↓ DTE filter (3–30 days default)
    ↓ Liquidity filter (spread, OI, volume)
    ↓ Underlying edge classification
    ↓ IV filter (IV vs realized vol)
    ↓ Contract structure filter
    ↓ Monte Carlo (10,000 sims per finalist)
    ↓ Expected Value + Conservative EV
    ↓ OPTION1 Score ranking
TOP TRADES
```

**Order matters:** underlying analysis comes before option selection. Never pick an option first and invent a story.

## Module Map

| Module | Responsibility | Location (planned) |
|--------|---------------|-------------------|
| 1 | Underlying Engine | `backend/services/underlying.py` |
| 2 | Option Chain Filter | `backend/services/chain_filter.py` |
| 3 | Liquidity Scoring | `backend/services/liquidity.py` |
| 4 | Greeks Analysis | `backend/services/greeks.py` |
| 5 | IV Analysis | `backend/services/iv_analysis.py` |
| 6 | Expected Move | `backend/services/expected_move.py` |
| 7 | Probability Model | `backend/services/probability.py` |
| 8 | Monte Carlo | `backend/services/monte_carlo.py` |
| 9 | Option Repricing | `backend/services/repricing.py` |
| 10 | Expected Value | `backend/services/ev.py` |
| 11 | Conservative EV | `backend/services/conservative_ev.py` |
| 12 | Contract Comparison | `backend/services/comparison.py` |
| 13 | OPTION1 Score | `backend/services/scoring.py` |
| 14 | No Chase Detection | `backend/services/no_chase.py` |
| 15 | SQQQ Special Logic | `backend/services/sqqq.py` |

## Data Flow (Phase 1 — Current)

```
Browser → GET /api/diagnostics?symbol=QQQ
       → Next.js API Route (server)
       → marketdata.ts service
       → MarketData.app API (Bearer token)
       → Normalize + classify freshness
       → JSON response → Diagnostics UI
```

## Caching Strategy

| Data Type | TTL | Storage |
|-----------|-----|---------|
| Stock quotes | 30s (market hours) | PostgreSQL `stock_quotes` |
| Daily candles | 1 hour | PostgreSQL `stock_bars` |
| Expiration lists | 15 min | PostgreSQL + memory |
| Option chains | 60s per expiration | PostgreSQL `option_quotes` |

## Database Schema (Planned)

- `symbols` — configurable scan universe
- `stock_quotes` / `stock_bars` — cached market data
- `option_contracts` / `option_quotes` — option chain cache
- `option_analysis` — per-contract computed metrics
- `scan_runs` — funnel statistics per scan
- `trade_candidates` — ranked results
- `paper_trades` — simulated positions
- `model_predictions` / `model_results` — backtest tracking
- `settings` — user risk preferences

## Security

- API token in `.env.local` (gitignored)
- Next.js API routes act as BFF (Backend for Frontend)
- FastAPI backend not directly exposed to internet in production
- CORS restricted to frontend origin

## SQQQ Special Case

SQQQ is a -3x daily inverse Nasdaq ETF. Multi-day returns do not equal -3× QQQ return due to daily reset compounding. Scanner uses QQQ as primary signal, simulates QQQ paths, then derives SQQQ via daily compounding before pricing SQQQ options.
