import { NextResponse } from "next/server";
import { getCacheStats, purgeExpiredCache } from "@/services/cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getCacheStats();
  return NextResponse.json(stats);
}

export async function DELETE() {
  const purged = await purgeExpiredCache();
  return NextResponse.json({ purged });
}
