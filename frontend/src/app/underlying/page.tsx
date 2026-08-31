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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import type { UnderlyingClassification, UnderlyingMetrics } from "@/types/underlying";

const CLASSIFICATION_COLORS: Record<UnderlyingClassification, string> = {
  "STRONG BULLISH": "text-emerald-400 border-emerald-500/40",
  BULLISH: "text-green-400 border-green-500/40",
  NEUTRAL: "text-slate-400 border-slate-500/40",
  BEARISH: "text-orange-400 border-orange-500/40",
  "STRONG BEARISH": "text-red-400 border-red-500/40",
  OVEREXTENDED: "text-amber-400 border-amber-500/40",
  "NO EDGE": "text-slate-500 border-slate-600/40",
};

function pct(v: number | null): string {
  if (v === null) return "—";
  return `${(v * 100).toFixed(2)}%`;
}

function num(v: number | null, decimals = 2): string {
  if (v === null) return "—";
  return v.toFixed(decimals);
}

export default function UnderlyingPage() {
  const [results, setResults] = useState<UnderlyingMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/underlying/universe");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load");
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const runScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/underlying/universe", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Scan failed");
      setResults(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Scan failed");
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    fetchResults();
  }, [fetchResults]);

  const sorted = [...results].sort((a, b) =>
    a.symbol.localeCompare(b.symbol),
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-lg font-bold text-white">
              OPTION1
            </Link>
            <Badge variant="outline" className="text-slate-400 text-xs">
              Underlying Engine
            </Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchResults}
              disabled={loading}
              className="border-slate-700"
            >
              Refresh
            </Button>
            <Button
              size="sm"
              onClick={runScan}
              disabled={scanning}
              className="bg-emerald-600 hover:bg-emerald-500"
            >
              {scanning ? "Scanning…" : "Scan Universe"}
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
        <Card className="border-slate-800 bg-slate-900/50">
          <CardHeader>
            <CardTitle className="text-white">Module 1 — Underlying Engine</CardTitle>
            <CardDescription className="text-slate-400">
              Technical analysis from real MarketData.app daily candles. Classifications
              are rule-based — not AI guesses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              {results.length} symbols analyzed · SMA/EMA/RSI/ATR/HV from cached candles
            </p>
          </CardContent>
        </Card>

        {error && (
          <Card className="border-red-900/50 bg-red-950/20">
            <CardContent className="pt-6 text-red-400 text-sm">{error}</CardContent>
          </Card>
        )}

        {loading && <Skeleton className="h-96 w-full bg-slate-800" />}

        {!loading && sorted.length === 0 && (
          <Card className="border-slate-800 bg-slate-900/50">
            <CardContent className="py-12 text-center text-slate-400">
              No analysis yet. Click <strong>Scan Universe</strong> to analyze all 36 symbols.
            </CardContent>
          </Card>
        )}

        {!loading && sorted.length > 0 && (
          <Card className="border-slate-800 bg-slate-900/50 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800">
                  <TableHead className="text-slate-500">Symbol</TableHead>
                  <TableHead className="text-slate-500">Classification</TableHead>
                  <TableHead className="text-slate-500">Price</TableHead>
                  <TableHead className="text-slate-500">1D</TableHead>
                  <TableHead className="text-slate-500">5D</TableHead>
                  <TableHead className="text-slate-500">20D</TableHead>
                  <TableHead className="text-slate-500">RSI</TableHead>
                  <TableHead className="text-slate-500">HV</TableHead>
                  <TableHead className="text-slate-500">Rel Vol</TableHead>
                  <TableHead className="text-slate-500">vs EMA20</TableHead>
                  <TableHead className="text-slate-500">Support</TableHead>
                  <TableHead className="text-slate-500">Resistance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.map((r) => (
                  <TableRow key={r.symbol} className="border-slate-800">
                    <TableCell className="font-mono font-medium text-white">
                      {r.symbol}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`text-[10px] font-mono ${CLASSIFICATION_COLORS[r.classification]}`}
                      >
                        {r.classification}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      ${num(r.price)}
                    </TableCell>
                    <TableCell
                      className={`font-mono text-sm ${(r.return1d ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {pct(r.return1d)}
                    </TableCell>
                    <TableCell
                      className={`font-mono text-sm ${(r.return5d ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {pct(r.return5d)}
                    </TableCell>
                    <TableCell
                      className={`font-mono text-sm ${(r.return20d ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"}`}
                    >
                      {pct(r.return20d)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {num(r.rsi14, 1)}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {r.historicalVolatility
                        ? `${(r.historicalVolatility * 100).toFixed(1)}%`
                        : "—"}
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {num(r.relativeVolume, 2)}x
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {num(r.distanceFromEma20, 2)}%
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-400">
                      ${num(r.support)}
                    </TableCell>
                    <TableCell className="font-mono text-sm text-slate-400">
                      ${num(r.resistance)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </main>
    </div>
  );
}
