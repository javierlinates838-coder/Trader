# OPTION1 Scanner Specification

## Mission

Find the **best value** option trades — not the cheapest, not the highest delta, not lottery tickets — by combining underlying edge, volatility value, expected value, and execution quality into a single transparent score.

## Scan Order (Mandatory)

1. Scan underlying stocks/ETFs
2. Determine bullish/bearish/no-edge setup
3. Pull option chains
4. Filter bad contracts
5. Analyze IV
6. Analyze Greeks
7. Calculate expected move
8. Simulate future prices
9. Calculate option expected value
10. Stress-test EV
11. Score liquidity
12. Score risk
13. Rank contracts
14. Return best value trades

## Underlying Universe (Default)

```
SPY, QQQ, IWM, DIA, NVDA, AAPL, MSFT, AMZN, META, GOOGL,
TSLA, AMD, AVGO, NFLX, PLTR, COIN, MSTR, HOOD, SOFI,
AAL, DAL, UAL, CCL, RCL, XOM, CVX, SMH, XLK, XLE, XLF,
TLT, GLD, SLV, SQQQ, TQQQ
```

Configurable via `settings` table. Accuracy > quantity.

## Underlying Classification

Based on returns, SMAs (20/50/200), EMAs (9/20/50/200), RSI(14), ATR(14), historical vol, relative volume, support/resistance, and distance from EMAs:

| Classification | Meaning |
|---------------|---------|
| STRONG BULLISH | Clear uptrend with momentum |
| BULLISH | Moderate bullish bias |
| NEUTRAL | No directional edge |
| BEARISH | Moderate bearish bias |
| STRONG BEARISH | Clear downtrend with momentum |
| OVEREXTENDED | Move may be exhausted |
| NO EDGE | Insufficient signal — do not force direction |

## Option Chain Filters (Default)

- **DTE:** 3–30 days
- **Reject:** bid=0, ask=0, missing/stale quote, spread > 20%, OI < 50
- **Prefer:** ATM, slightly ITM, slightly OTM
- **Flag:** Far OTM → LOTTERY ONLY

## OPTION1 Score (0–100)

Components:
- Underlying Edge
- Volatility Value (IV vs RV)
- Conservative EV
- Probability of Profit
- Liquidity
- Theta Risk
- Reward/Risk
- Contract Structure
- Execution Quality

| Score | Status |
|-------|--------|
| 90–100 | ELITE |
| 80–89 | APPROVED |
| 70–79 | APPROVED SMALL |
| 60–69 | WATCH |
| 50–59 | SPECULATIVE |
| 40–49 | LOTTERY ONLY |
| < 40 | PASS |

## Hard Pass Rules

Automatic PASS regardless of score:
- Stale quote
- No bid
- Extreme spread
- Insufficient liquidity
- Missing critical API data
- Negative conservative EV
- Broken option chain
- Expired contract
- Calculation error

## Scan Modes

| Mode | Priority |
|------|----------|
| BEST VALUE | Conservative EV |
| BEST ODDS | Probability, delta, liquidity, low theta |
| BALANCED | Even weighting |
| CHEAP CONTRACTS | Low premium filter |
| HIGH UPSIDE | Higher convexity allowed |
| LOTTERY | Show loss probability prominently |

## Risk System

User inputs:
- Account balance (e.g. $500)
- Max trade risk % (default 5%)

Output: recommended max premium = `balance × risk%`

## No Chase Detection

| Status | Meaning |
|--------|---------|
| EARLY | Move just starting |
| GOOD ENTRY | Favorable timing |
| PARTIALLY PRICED | Some move already priced in |
| LATE | Most move captured |
| DO NOT CHASE | Too late — pass |

## Paper Trading

Track simulated buys with entry metrics. Monitor current value, P/L, max gain, max drawdown. No live trading connection.

## Explanation Generation

All "why it ranks" text generated **only** from calculated values:

> GOOD: "Contract spread is 4.2%, open interest is 4,830, and modeled downside exceeds the market-implied move."

> BAD: "AI believes this option will explode." ← Never.
