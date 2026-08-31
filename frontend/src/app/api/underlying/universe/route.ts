import { NextResponse } from "next/server";
import { analyzeUniverse } from "@/services/underlying";
import { getAllLatestUnderlyingAnalysis } from "@/services/cache";
import { enqueueScanJob } from "@/services/scan-queue";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET() {
  const cached = await getAllLatestUnderlyingAnalysis();
  return NextResponse.json({
    count: cached.length,
    results: cached,
  });
}

/** Run full universe analysis (expensive — uses API credits) */
export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const async = searchParams.get("async") === "true";

  if (async) {
    const id = await enqueueScanJob({
      jobType: "universe_underlying_scan",
      priority: 5,
    });
    return NextResponse.json({ queued: true, jobId: id });
  }

  try {
    const result = await analyzeUniverse();
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Universe scan failed" },
      { status: 500 },
    );
  }
}
