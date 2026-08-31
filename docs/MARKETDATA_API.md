# MarketData.app API Reference (OPTION1)

Official documentation: https://www.marketdata.app/docs/api/

All requests use **Bearer token** authentication:

```http
Authorization: Bearer {MARKETDATA_TOKEN}
```

Base URL: `https://api.marketdata.app/v1`

## Endpoints Used

### Stock Quotes

```
GET /v1/stocks/quotes/{symbol}/
GET /v1/stocks/quotes/?symbols=AAPL,QQQ,SPY
```

**Response fields (columnar arrays):**

| Field | Type | Notes |
|-------|------|-------|
| `s` | string | `"ok"`, `"no_data"`, or `"error"` |
| `symbol` | string[] | Ticker symbols |
| `bid` | number[] | Bid price |
| `ask` | number[] | Ask price |
| `bidSize` | number[] | Shares at bid |
| `askSize` | number[] | Shares at ask |
| `mid` | number[] | Midpoint |
| `last` | number[] | Last trade price |
| `change` | number[] | Dollar change vs prior close |
| `changepct` | number[] | Decimal percent change (0.03 = 3%) |
| `volume` | number[] | Session volume |
| `updated` | number[] | Unix timestamp (US Eastern) |
| `52weekHigh` | number[] | Only if `52week=true` param |
| `52weekLow` | number[] | Only if `52week=true` param |

**Data availability (stocks):**

| User Type | UTP Entitlement | Quote Type |
|-----------|----------------|------------|
| Non-Professional | Yes | 15-min delayed |
| Non-Professional | No | Historical (1 day old) |
| Professional | Any | Historical (1 day old) |

**Cost:** 1 credit per symbol

### Stock Candles

```
GET /v1/stocks/candles/{resolution}/{symbol}/
```

**Parameters:**
- `resolution` — `D`, `1H`, `5`, `15`, `30`, `W`, `M`, etc.
- `from`, `to` — date range (ISO 8601, unix, or spreadsheet)
- `countback` — number of candles before `to`

**Response fields:**

| Field | Type | Notes |
|-------|------|-------|
| `o`, `h`, `l`, `c` | number[] | OHLC |
| `v` | number[] | Volume |
| `t` | number[] | Candle timestamps (US Eastern) |
| `s` | string | `"ok"` or `"no_data"` |

### Option Expirations

```
GET /v1/options/expirations/{underlyingSymbol}/
```

**Response fields:**

| Field | Type | Notes |
|-------|------|-------|
| `expirations` | string[] | ISO date strings (`YYYY-MM-DD`) |
| `updated` | number | Unix timestamp |

**Cost:** 1 credit per API call

### Option Chain

```
GET /v1/options/chain/{underlyingSymbol}/
```

**Key filter parameters:**
- `expiration` — ISO date (`2025-09-19`)
- `side` — `call` or `put`
- `dte` — days to expiry (closest match)
- `from`, `to` — expiration date range
- `strike` — specific strike
- `delta` — filter by delta
- `range` — `itm`, `otm`, `atm`, `all`
- `weekly`, `monthly`, `quarterly` — expiration type filters

**Response fields (per contract, columnar arrays):**

| Field | Type | Source |
|-------|------|--------|
| `optionSymbol` | string[] | API |
| `underlying` | string[] | API |
| `expiration` | number[] | API (unix timestamp) |
| `side` | string[] | API (`call`/`put`) |
| `strike` | number[] | API |
| `firstTraded` | number[] | API |
| `dte` | number[] | API |
| `bid`, `ask`, `mid` | number[] | API |
| `bidSize`, `askSize` | number[] | API |
| `last` | number[] | API |
| `volume` | number[] | API |
| `openInterest` | number[] | API |
| `underlyingPrice` | number[] | API |
| `inTheMoney` | boolean[] | API |
| `intrinsicValue` | number[] | API |
| `extrinsicValue` | number[] | API |
| `iv` | number[] | API (decimal, e.g. 0.35 = 35%) |
| `delta` | number[] | API |
| `gamma` | number[] | API |
| `theta` | number[] | API |
| `vega` | number[] | API |
| `updated` | number[] | API (unix timestamp) |

**Data availability (options):**

| User Type | OPRA Entitlement | Data Type |
|-----------|-----------------|-----------|
| Non-Professional | Yes | Real-time |
| Non-Professional | No | 15-min delayed |
| Professional | Any | Historical (1 day old) |

**Cost:** 1 credit per option contract returned

### Option Quotes (single contract)

```
GET /v1/options/quotes/{optionSymbol}/
```

Same fields as chain, but for a single contract. Supports `date`, `from`, `to` for historical series.

## Fields We Calculate Locally

| Field | Formula |
|-------|---------|
| `spreadPercent` | `(ask - bid) / mid × 100` |
| `thetaBurnPercent` | `|theta| / premium × 100` |
| `optionCost` | `mid × 100` (per contract) |
| `breakeven` | `strike ± premium` (call/put) |
| SMA / EMA | From daily candles |
| RSI(14) | From daily candles |
| ATR(14) | From daily candles |
| Historical volatility | Std dev of log returns × √252 |
| IV / RV ratio | `iv / historical_volatility` |
| Expected move | `underlying × iv × √(dte/365)` |
| Monte Carlo paths | GBM with trend adjustment |
| Black-Scholes price | scipy / py_vollib |
| Expected Value | `Σ(probability × future_value) - cost - slippage` |
| Conservative EV | Stress-adjusted EV |
| OPTION1 Score | Weighted composite 0–100 |
| Data freshness | Based on `updated` timestamp + market hours |

## Data Freshness Classification

| Status | Condition |
|--------|-----------|
| REALTIME | Quote age ≤ 1 minute during market hours |
| DELAYED | Quote age ≤ 20 minutes during market hours |
| STALE | Quote age > 20 minutes |
| MARKET CLOSED | Outside 9:30–16:00 ET Mon–Fri |

## Error Handling

| Response | HTTP | Action |
|----------|------|--------|
| `s: "ok"` | 200 | Process data |
| `s: "no_data"` | 404 | Show "DATA UNAVAILABLE" |
| `s: "error"` | 400 | Log + show error message |
| Rate limit | 429 | Back off + retry with queue |

## Implementation Files

- **TypeScript:** `frontend/src/services/marketdata.ts`
- **Python:** `backend/providers/marketdata.py`

## Demo Mode (No Token)

Without a token, these symbols work for historical data only:
- Stocks: `AAPL`
- Options: any AAPL contract (e.g. `AAPL271217C00250000`)
