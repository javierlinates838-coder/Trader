"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { freshnessColor } from "@/lib/data-freshness";
import type {
  DataFreshness,
  NormalizedOptionContract,
  NormalizedStockQuote,
} from "@/types/marketdata";

interface DiagnosticsResult {
  connectionMode?: "authenticated" | "demo" | "unconfigured";
  health: {
    connected: boolean;
    lastSuccessfulRequest: string | null;
    latestQuoteTimestamp: string | null;
    dataFreshness: DataFreshness;
    error: string | null;
  };
  symbol: string;
  quote?: unknown;
  normalizedQuote?: NormalizedStockQuote;
  expirations?: { expirations?: string[]; updated?: number };
  targetExpiration?: string;
  chain?: unknown;
  normalizedChain?: NormalizedOptionContract[];
  chainContractCount?: number;
  error?: string;
}

function StatusBadge({
  connected,
  freshness,
}: {
  connected: boolean;
  freshness: DataFreshness;
}) {
  if (!connected) {
    return (
      <Badge variant="destructive" className="text-xs">
        FAILED
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className={`text-xs font-mono ${freshnessColor(freshness)}`}
    >
      {freshness.replace("_", " ")}
    </Badge>
  );
}

function FieldTable({
  title,
  fields,
}: {
  title: string;
  fields: { name: string; source: "API" | "CALCULATED"; value: string }[];
}) {
  return (
    <Card className="border-slate-800 bg-slate-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-200">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-800 hover:bg-transparent">
              <TableHead className="text-slate-500">Field</TableHead>
              <TableHead className="text-slate-500">Source</TableHead>
              <TableHead className="text-slate-500">Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((f) => (
              <TableRow key={f.name} className="border-slate-800">
                <TableCell className="font-mono text-xs text-slate-300">
                  {f.name}
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={
                      f.source === "API"
                        ? "border-emerald-500/40 text-emerald-400 text-[10px]"
                        : "border-amber-500/40 text-amber-400 text-[10px]"
                    }
                  >
                    {f.source}
                  </Badge>
                </TableCell>
                <TableCell className="font-mono text-xs text-slate-400">
                  {f.value}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default function DiagnosticsPage() {
  const [data, setData] = useState<DiagnosticsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("QQQ");

  const fetchDiagnostics = useCallback(async (sym: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/diagnostics?symbol=${sym}`);
      const json = await res.json();
      setData(json);
    } catch {
      setData({
        health: {
          connected: false,
          lastSuccessfulRequest: null,
          latestQuoteTimestamp: null,
          dataFreshness: "STALE",
          error: "Failed to reach diagnostics API",
        },
        symbol: sym,
        error: "Failed to reach diagnostics API",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDiagnostics(symbol);
  }, [symbol, fetchDiagnostics]);

  const q = data?.normalizedQuote;
  const contracts = data?.normalizedChain ?? [];

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-lg font-bold tracking-tight text-white"
            >
              OPTION1
            </Link>
            <Badge variant="outline" className="text-slate-400 text-xs">
              Diagnostics
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              className="w-20 rounded border border-slate-700 bg-slate-900 px-2 py-1 font-mono text-sm text-white"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => fetchDiagnostics(symbol)}
              disabled={loading}
              className="border-slate-700"
            >
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full bg-slate-800" />
            <Skeleton className="h-64 w-full bg-slate-800" />
          </div>
        )}

        {!loading && data && (
          <>
            {/* API Health */}
            <Card className="border-slate-800 bg-slate-900/50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">API Status</CardTitle>
                  <StatusBadge
                    connected={data.health.connected}
                    freshness={data.health.dataFreshness}
                  />
                </div>
                <CardDescription className="text-slate-400">
                  MarketData.app connection test for {data.symbol}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-xs text-slate-500">Connection</p>
                    <p
                      className={`font-mono text-sm ${data.health.connected ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {data.health.connected ? "CONNECTED" : "FAILED"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Data Freshness</p>
                    <p
                      className={`font-mono text-sm ${freshnessColor(data.health.dataFreshness)}`}
                    >
                      {data.health.dataFreshness.replace("_", " ")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Last Request</p>
                    <p className="font-mono text-sm text-slate-300">
                      {data.health.lastSuccessfulRequest ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Quote Timestamp</p>
                    <p className="font-mono text-sm text-slate-300">
                      {data.health.latestQuoteTimestamp ?? "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {data.connectionMode === "demo" && (
              <Alert className="border-amber-500/50 bg-amber-950/30">
                <AlertTitle className="text-amber-400">DEMO MODE</AlertTitle>
                <AlertDescription className="text-amber-200/80">
                  Using unauthenticated MarketData.app demo endpoints (AAPL only).
                  Add MARKETDATA_TOKEN to .env.local for full symbol access including QQQ.
                </AlertDescription>
              </Alert>
            )}

            {data.error && (
              <Alert variant="destructive" className="border-red-900/50">
                <AlertTitle>Market Data Not Connected</AlertTitle>
                <AlertDescription>{data.error}</AlertDescription>
              </Alert>
            )}

            {data.health.connected && q && (
              <>
                {/* Stock Quote */}
                <FieldTable
                  title={`${data.symbol} Stock Quote`}
                  fields={[
                    { name: "symbol", source: "API", value: q.symbol },
                    { name: "bid", source: "API", value: String(q.bid) },
                    { name: "ask", source: "API", value: String(q.ask) },
                    { name: "mid", source: "API", value: String(q.mid) },
                    { name: "last", source: "API", value: String(q.last) },
                    {
                      name: "volume",
                      source: "API",
                      value: String(q.volume),
                    },
                    {
                      name: "change",
                      source: "API",
                      value: String(q.change),
                    },
                    {
                      name: "changePct",
                      source: "API",
                      value: q.changePct
                        ? `${(q.changePct * 100).toFixed(2)}%`
                        : "null",
                    },
                    {
                      name: "updated",
                      source: "API",
                      value: q.updatedIso ?? "null",
                    },
                  ]}
                />

                {/* Expirations */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Option Expirations
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      {data.expirations?.expirations?.length ?? 0} expirations
                      found
                      {data.targetExpiration &&
                        ` · Chain fetched for ${data.targetExpiration}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono text-xs text-slate-400 break-all">
                      {(data.expirations?.expirations ?? [])
                        .slice(0, 20)
                        .join(", ")}
                      {(data.expirations?.expirations?.length ?? 0) > 20 &&
                        " …"}
                    </p>
                  </CardContent>
                </Card>

                {/* Option Chain Sample */}
                {contracts.length > 0 && (
                  <Card className="border-slate-800 bg-slate-900/50">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Option Chain Sample (ATM puts, top 10)
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {data.chainContractCount} contracts in chain · showing
                        normalized fields
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="overflow-x-auto p-0">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-slate-800">
                            <TableHead className="text-slate-500">
                              Symbol
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Strike
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Bid
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Ask
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Spread%
                            </TableHead>
                            <TableHead className="text-slate-500">
                              IV
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Delta
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Theta
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Theta%
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Vol
                            </TableHead>
                            <TableHead className="text-slate-500">
                              OI
                            </TableHead>
                            <TableHead className="text-slate-500">
                              Updated
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {contracts.map((c) => (
                            <TableRow
                              key={c.optionSymbol}
                              className="border-slate-800"
                            >
                              <TableCell className="font-mono text-[10px] text-slate-300">
                                {c.optionSymbol}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.strike}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-emerald-400">
                                {c.bid}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-red-400">
                                {c.ask}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.spreadPercent?.toFixed(1)}%
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.iv
                                  ? `${(c.iv * 100).toFixed(1)}%`
                                  : "—"}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.delta?.toFixed(3)}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.theta?.toFixed(3)}
                              </TableCell>
                              <TableCell className="font-mono text-xs text-amber-400">
                                {c.thetaBurnPercent?.toFixed(1)}%
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.volume}
                              </TableCell>
                              <TableCell className="font-mono text-xs">
                                {c.openInterest}
                              </TableCell>
                              <TableCell className="font-mono text-[10px] text-slate-500">
                                {c.updatedIso}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}

                {/* Field Source Analysis */}
                <Card className="border-slate-800 bg-slate-900/50">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Field Source Analysis
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      What MarketData.app provides vs what we calculate locally
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-emerald-400">
                          Provided by API
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-400 font-mono">
                          <li>bid, ask, bidSize, askSize, mid, last</li>
                          <li>volume, openInterest</li>
                          <li>iv, delta, gamma, theta, vega</li>
                          <li>intrinsicValue, extrinsicValue</li>
                          <li>underlyingPrice, inTheMoney</li>
                          <li>strike, expiration, dte, side</li>
                          <li>updated (quote timestamp)</li>
                          <li>change, changepct (stocks)</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-amber-400">
                          Calculated Locally
                        </h4>
                        <ul className="space-y-1 text-xs text-slate-400 font-mono">
                          <li>spreadPercent = (ask-bid)/mid × 100</li>
                          <li>thetaBurnPercent = |theta|/premium × 100</li>
                          <li>dataFreshness classification</li>
                          <li>SMA, EMA, RSI, ATR (from candles)</li>
                          <li>historical volatility</li>
                          <li>expected move, Monte Carlo EV</li>
                          <li>Black-Scholes repricing</li>
                          <li>OPTION1 score components</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Raw JSON */}
                <Tabs defaultValue="quote">
                  <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="quote">Raw Quote</TabsTrigger>
                    <TabsTrigger value="expirations">Raw Expirations</TabsTrigger>
                    <TabsTrigger value="chain">Raw Chain</TabsTrigger>
                  </TabsList>
                  <TabsContent value="quote">
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 font-mono">
                      {JSON.stringify(data.quote, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="expirations">
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 font-mono">
                      {JSON.stringify(data.expirations, null, 2)}
                    </pre>
                  </TabsContent>
                  <TabsContent value="chain">
                    <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-4 text-xs text-slate-400 font-mono max-h-[600px]">
                      {JSON.stringify(data.chain, null, 2)}
                    </pre>
                  </TabsContent>
                </Tabs>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
