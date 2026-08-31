# OPTION1 — Options Value Scanner

Production-quality options value scanner using **only** [MarketData.app](https://www.marketdata.app/) for market data.

## Phase 2 Status: Database & Caching + Vercel Deploy

PostgreSQL caching layer via **Vercel Postgres (Neon)**. See [Deployment Guide](docs/DEPLOYMENT.md).

### Quick Start (Local)

1. Copy environment file and add your token:

```bash
cp .env.example .env.local
# Edit .env.local and set MARKETDATA_TOKEN=your_token
```

2. Start the frontend:

```bash
cd frontend
npm install
npm run dev
```

3. Open [http://localhost:3000/diagnostics](http://localhost:3000/diagnostics)

### Deploy to Vercel

1. Import repo on Vercel with **Root Directory** = `frontend`
2. Add **Vercel Postgres** storage (auto-sets `POSTGRES_URL`)
3. Set `MARKETDATA_TOKEN`, `CRON_SECRET`, `MIGRATE_SECRET`
4. Run migration: `POST /api/db/migrate`

Full guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)

### Project Structure

```
/workspace
├── frontend/          # Next.js + TypeScript + Tailwind + shadcn/ui
│   └── src/
│       ├── services/marketdata.ts   # Server-side MarketData client
│       └── app/api/diagnostics/     # API route (token stays server-side)
├── backend/           # Python FastAPI scanner engine (Phase 2+)
│   └── providers/marketdata.py
└── docs/              # Architecture and API documentation
```

### Backend (Phase 2+)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --app-dir .
```

## Documentation

- [Deployment (Vercel)](docs/DEPLOYMENT.md)
- [MarketData API](docs/MARKETDATA_API.md)
- [OPTION1 Scanner](docs/OPTION1.md)
- [Roadmap](docs/ROADMAP.md)

## Data Policy

- **No fake data** in production
- All scores from real API data + calculations
- Data freshness clearly labeled: REALTIME / DELAYED / STALE / MARKET CLOSED
- Token never exposed to frontend
