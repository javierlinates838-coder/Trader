# Deploying OPTION1 to Vercel

OPTION1 deploys as a **Next.js app** from the `frontend/` directory with **Vercel Postgres (Neon)** for caching and the scan queue.

## 1. Push to GitHub

The repo is already connected. Vercel will deploy from `main` after merge.

## 2. Create Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `Trader` GitHub repository
3. Framework Preset: **Next.js** (auto-detected)
4. **Root Directory:** leave as `.` (repo root) — `vercel.json` at the repo root sets `"rootDirectory": "frontend"` automatically

> If the site shows a build error or blank page, open **Settings → General → Root Directory** and set it to `frontend`, then redeploy.

## 3. Add Vercel Postgres

1. In your Vercel project → **Storage** → **Create Database** → **Postgres**
2. This auto-sets `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` env vars

## 4. Environment Variables

In Vercel → **Settings** → **Environment Variables**:

| Variable | Required | Description |
|----------|----------|-------------|
| `MARKETDATA_TOKEN` | Yes | Your MarketData.app API token |
| `POSTGRES_URL` | Yes | Auto-set by Vercel Postgres |
| `POSTGRES_URL_NON_POOLING` | Yes | Auto-set (used for migrations) |
| `CRON_SECRET` | Recommended | Random string to protect cron routes |
| `MIGRATE_SECRET` | Recommended | Random string to protect `/api/db/migrate` |

## 5. Run Database Migration

After first deploy, run migrations once:

```bash
curl -X POST https://your-app.vercel.app/api/db/migrate \
  -H "Authorization: Bearer YOUR_MIGRATE_SECRET"
```

This creates all tables and seeds the 36-symbol scan universe.

## 6. Verify Deployment

- **Health:** `GET /api/health`
- **Diagnostics:** `/diagnostics`
- **Cache stats:** `GET /api/cache/stats`

## Architecture on Vercel

```
Browser → Vercel Edge/Node (Next.js)
       → PostgreSQL cache (Neon)
       → MarketData.app API (server-side only)
```

- All MarketData requests stay server-side
- Quotes/chains cached in Postgres (saves API credits)
- Cron job runs every 5 min: purge expired cache + process scan queue
- FastAPI backend (`backend/`) is for local dev only; production scanner logic lives in Next.js API routes

## Cron Jobs

Configured in `frontend/vercel.json`:
- `GET /api/cron/process-queue` every 5 minutes

Requires `CRON_SECRET` env var on Vercel (Hobby plan supports 2 cron jobs).

## Local Development

```bash
cd frontend
cp .env.example .env.local
# Add MARKETDATA_TOKEN and POSTGRES_URL (from Vercel: vercel env pull)

npm install
npm run dev
```

Pull Vercel env vars locally:
```bash
npx vercel link
npx vercel env pull .env.local
```

## Cache TTLs

| Data | TTL |
|------|-----|
| Stock quotes | 30s (market hours) |
| Daily candles | 1 hour |
| Option expirations | 15 min |
| Option chains | 60s |
