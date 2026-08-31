import { NextResponse } from "next/server";
import { isDatabaseConfigured } from "@/db";
import { getCacheStats } from "@/services/cache";
import { getConnectionMode } from "@/services/marketdata";

export const dynamic = "force-dynamic";

export async function GET() {
  const cacheStats = await getCacheStats();

  return NextResponse.json({
    status: "ok",
    marketData: {
      connectionMode: getConnectionMode(),
      tokenConfigured: !!process.env.MARKETDATA_TOKEN,
    },
    database: {
      configured: isDatabaseConfigured(),
      connected: cacheStats.databaseConnected,
    },
    cache: cacheStats,
    timestamp: new Date().toISOString(),
  });
}
