"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface HealthData {
  status: string;
  marketData: {
    connectionMode: string;
    tokenConfigured: boolean;
  };
  database: {
    configured: boolean;
    connected: boolean;
  };
}

export function SetupStatus() {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setError(true));
  }, []);

  if (error) {
    return (
      <div className="rounded-lg border border-red-900/50 bg-red-950/30 p-4 text-sm text-red-300 max-w-lg">
        Could not reach API. If you just deployed, check Vercel Root Directory is{" "}
        <code className="text-red-200">frontend</code> or redeploy after the latest merge.
      </div>
    );
  }

  if (!health) {
    return (
      <div className="text-sm text-slate-500 animate-pulse">Checking system status…</div>
    );
  }

  const apiOk =
    health.marketData.tokenConfigured ||
    health.marketData.connectionMode === "demo";

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-4 max-w-lg w-full space-y-3">
      <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">
        System Status
      </p>
      <div className="flex flex-wrap gap-2">
        <Badge
          variant="outline"
          className={
            apiOk
              ? "border-emerald-500/40 text-emerald-400"
              : "border-amber-500/40 text-amber-400"
          }
        >
          MarketData:{" "}
          {health.marketData.tokenConfigured
            ? "TOKEN SET"
            : health.marketData.connectionMode === "demo"
              ? "DEMO MODE"
              : "NO TOKEN"}
        </Badge>
        <Badge
          variant="outline"
          className={
            health.database.connected
              ? "border-emerald-500/40 text-emerald-400"
              : health.database.configured
                ? "border-amber-500/40 text-amber-400"
                : "border-slate-600 text-slate-400"
          }
        >
          Database:{" "}
          {health.database.connected
            ? "CONNECTED"
            : health.database.configured
              ? "CONFIGURED"
              : "NOT SET"}
        </Badge>
      </div>
      {!health.marketData.tokenConfigured && (
        <p className="text-xs text-slate-500">
          Add <code className="text-slate-400">MARKETDATA_TOKEN</code> in Vercel → Settings →
          Environment Variables, then redeploy.{" "}
          <Link href="/diagnostics" className="text-emerald-400 hover:underline">
            Test connection
          </Link>
        </p>
      )}
    </div>
  );
}
