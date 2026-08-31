# Deploying OPTION1 to Vercel

OPTION1 deploys as a **Next.js app** from the `frontend/` directory with **Vercel Postgres (Neon)** for caching and the scan queue.

## 1. Push to GitHub

The repo is already connected. Vercel will deploy from `main` after merge.

## 2. Import on Vercel (Services)

1. Go to [vercel.com/new/import](https://vercel.com/new/import)
2. Select the **Trader** repository
3. **Application Preset:** **Services** (Vercel auto-detects `frontend` + `backend`)
4. Confirm paths:
   - **frontend** → `/` (Next.js)
   - **backend** → `/api/backend` (FastAPI — optional, scanner runs in Next.js)
5. Expand **Environment Variables** and add:

| Variable | Required | What to put |
|----------|----------|-------------|
| `MARKETDATA_TOKEN` | **Yes** | Your **one** MarketData.app API key from the email |

That's all you need to start. The variables below are optional passwords you invent yourself — **not** additional API keys:

| Variable | Required | What to put |
|----------|----------|-------------|
| `MIGRATE_SECRET` | Optional | Any random string you make up |
| `CRON_SECRET` | Optional | Any random string you make up |

6. Click **Deploy**

> The root `vercel.json` defines both services. You do **not** need to edit it manually.

### Where to set the API token

**During import:** expand **Environment Variables** on the deploy screen and add `MARKETDATA_TOKEN`.

**After deploy:** Project → **Settings** → **Environment Variables** → add `MARKETDATA_TOKEN` → **Redeploy**.

The token is server-side only — never exposed to the browser.

## 3. Add Vercel Postgres

1. In your Vercel project → **Storage** → **Create Database** → **Postgres**
2. This auto-sets `POSTGRES_URL` and `POSTGRES_URL_NON_POOLING` env vars

## 4. Environment Variables (summary)

| Variable | Required | Description |
|----------|----------|-------------|
| `MARKETDATA_TOKEN` | **Yes** | Your **only** MarketData.app API key |
| `POSTGRES_URL` | Yes (for DB) | Auto-set when you add Vercel Postgres |
| `POSTGRES_URL_NON_POOLING` | Yes (for DB) | Auto-set (used for migrations) |
| `MIGRATE_SECRET` | Optional | Random password you create — not an API key |
| `CRON_SECRET` | Optional | Random password you create — not an API key |

> **You only need one API key total:** `MARKETDATA_TOKEN`. Everything else is either auto-set by Vercel or a password you invent.

## 5. Run Database Migration

After first deploy, run migrations once:

```bash
curl -X POST https://your-app.vercel.app/api/db/migrate \
  -H "Authorization: Bearer YOUR_MIGRATE_SECRET"
```

This creates all tables and seeds the 36-symbol scan universe.

## 6. Verify Deployment

- **Home:** `/` — shows System Status (token + database)
- **Health:** `GET /api/health`
- **Diagnostics:** `/diagnostics` — test with **QQQ**
- **Underlying:** `/underlying` — technical analysis dashboard
- **Backend (optional):** `/api/backend/health` — FastAPI service

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

Configured at the root of `vercel.json` (routed to the frontend service via rewrites):
- `GET /api/cron/process-queue` every 5 minutes

`CRON_SECRET` is optional on Hobby plan for basic operation.

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
