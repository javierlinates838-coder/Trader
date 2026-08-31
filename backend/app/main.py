"""OPTION1 FastAPI backend — scanner engine (Phase 2+)."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
  title="OPTION1 Scanner API",
  description="Options value scanner backend powered by MarketData.app",
  version="0.1.0",
)

app.add_middleware(
  CORSMiddleware,
  allow_origins=["http://localhost:3000"],
  allow_credentials=True,
  allow_methods=["*"],
  allow_headers=["*"],
)


@app.get("/health")
async def health():
  return {"status": "ok", "service": "option1-backend"}


@app.get("/api/diagnostics/{symbol}")
async def diagnostics(symbol: str):
  """Run MarketData.app connectivity test for a symbol."""
  import sys
  from pathlib import Path

  sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
  from providers.marketdata import MarketDataClient, MarketDataError

  try:
    client = MarketDataClient()
    quote = await client.get_stock_quote(symbol)
    expirations = await client.get_option_expirations(symbol)

    target_exp = None
    chain = None
    if expirations.get("expirations"):
      target_exp = expirations["expirations"][0]
      chain = await client.get_option_chain(
        symbol, expiration=target_exp, side="put", range_="atm"
      )

    return {
      "health": {
        "connected": True,
        "last_success": client.last_success.isoformat()
        if client.last_success
        else None,
      },
      "symbol": symbol.upper(),
      "quote": quote,
      "expirations": expirations,
      "target_expiration": target_exp,
      "chain": chain,
      "chain_contract_count": len(chain.get("optionSymbol", []))
      if chain
      else 0,
    }
  except MarketDataError as e:
    return {
      "health": {"connected": False, "error": str(e)},
      "symbol": symbol.upper(),
      "error": str(e),
    }
