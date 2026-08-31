"""MarketData.app API provider — server-side only.

Official docs: https://www.marketdata.app/docs/api/
"""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any

import httpx

BASE_URL = "https://api.marketdata.app/v1"


class MarketDataError(Exception):
  def __init__(self, message: str, status: int = 500, response: Any = None):
    super().__init__(message)
    self.status = status
    self.response = response


class MarketDataClient:
  def __init__(self, token: str | None = None):
    self.token = token or os.environ.get("MARKETDATA_TOKEN", "")
    if not self.token:
      raise MarketDataError(
        "MARKETDATA_TOKEN is not configured", status=401
      )
    self._last_success: datetime | None = None
    self._latest_quote_ts: int | None = None

  async def _fetch(
    self, path: str, params: dict[str, Any] | None = None
  ) -> dict[str, Any]:
    headers = {
      "Authorization": f"Bearer {self.token}",
      "Accept": "application/json",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
      response = await client.get(
        f"{BASE_URL}{path}", headers=headers, params=params
      )
      data = response.json()

    if response.status_code >= 400 or data.get("s") == "error":
      raise MarketDataError(
        data.get("errmsg", f"HTTP {response.status_code}"),
        status=response.status_code,
        response=data,
      )

    self._last_success = datetime.now(timezone.utc)
    return data

  async def get_stock_quote(self, symbol: str) -> dict[str, Any]:
    data = await self._fetch(f"/stocks/quotes/{symbol.upper()}/")
    updated = data.get("updated")
    if updated and len(updated) > 0:
      self._latest_quote_ts = updated[0]
    return data

  async def get_option_expirations(
    self, underlying: str
  ) -> dict[str, Any]:
    return await self._fetch(
      f"/options/expirations/{underlying.upper()}/"
    )

  async def get_option_chain(
    self,
    underlying: str,
    *,
    expiration: str | None = None,
    side: str | None = None,
    dte: int | None = None,
    range_: str | None = None,
  ) -> dict[str, Any]:
    params: dict[str, Any] = {}
    if expiration:
      params["expiration"] = expiration
    if side:
      params["side"] = side
    if dte is not None:
      params["dte"] = dte
    if range_:
      params["range"] = range_

    data = await self._fetch(
      f"/options/chain/{underlying.upper()}/", params
    )
    updated = data.get("updated")
    if updated and len(updated) > 0:
      self._latest_quote_ts = updated[0]
    return data

  async def get_stock_candles(
    self,
    symbol: str,
    resolution: str = "D",
    *,
    countback: int | None = None,
    from_: str | None = None,
    to: str | None = None,
  ) -> dict[str, Any]:
    params: dict[str, Any] = {}
    if countback is not None:
      params["countback"] = countback
    if from_:
      params["from"] = from_
    if to:
      params["to"] = to

    return await self._fetch(
      f"/stocks/candles/{resolution}/{symbol.upper()}/", params
    )

  @property
  def last_success(self) -> datetime | None:
    return self._last_success

  @property
  def latest_quote_timestamp(self) -> int | None:
    return self._latest_quote_ts
