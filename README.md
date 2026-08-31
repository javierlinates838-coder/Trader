# OPTION1 — Options Value Scanner

Production-quality options value scanner using **only** [MarketData.app](https://www.marketdata.app/) for market data.

## Current Status

| Phase | Status |
|-------|--------|
| Phase 1 — MarketData connection | ✅ Complete |
| Phase 2 — PostgreSQL caching + Vercel deploy | ✅ Complete |
| Phase 3 — Underlying engine (SMA, RSI, ATR, classification) | ✅ Complete |
| Phase 4 — Option pipeline + scanner | 🔜 Next |

## Quick Start (Local)

1. Copy environment file and add your **one** API key:

```bash
cd frontend
cp .env.example .env.local
# Set MARKETDATA_TOKEN=your_key
```

2. Install and run:

```bash
npm install
npm run dev
```

3. Open:
- [http://localhost:3000/diagnostics](http://localhost:3000/diagnostics) — API test
- [http://localhost:3000/underlying](http://localhost:3000/underlying) — technical analysis

## Deploy to Vercel

1. Import at [vercel.com/new/import](https://vercel.com/new/import) — choose **Services** preset
2. Expand **Environment Variables** → add **only** `MARKETDATA_TOKEN` (your MarketData.app key)
3. Click **Deploy**
4. (Optional) Add **Vercel Postgres** under Storage → Redeploy
5. (Optional) Run migration: `POST /api/db/migrate`

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

## Project Structure

```
Trader/
├── frontend/          # Next.js app (deployed to Vercel)
│   └── src/services/marketdata.ts   # Server-side API client
├── backend/           # FastAPI (optional, at /api/backend on Vercel)
└── docs/              # Architecture & deployment docs
```

## Documentation

- [Deployment (Vercel)](docs/DEPLOYMENT.md)
- [Architecture](docs/ARCHITECTURE.md)
- [MarketData API](docs/MARKETDATA_API.md)
- [OPTION1 Scanner Spec](docs/OPTION1.md)
- [Roadmap](docs/ROADMAP.md)

## Data Policy

- **No fake data** in production
- All scores from real API data + calculations
- Data freshness: REALTIME / DELAYED / STALE / MARKET CLOSED
- API token never exposed to the browser
