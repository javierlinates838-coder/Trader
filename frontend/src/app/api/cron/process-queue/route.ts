import { NextResponse } from "next/server";
import { claimNextJob, completeJob, failJob } from "@/services/scan-queue";
import { purgeExpiredCache } from "@/services/cache";
import { analyzeUniverse } from "@/services/underlying";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    // No secret configured — accept Vercel cron invocations only
    return request.headers.get("user-agent")?.startsWith("vercel-cron/") ?? false;
  }
  const auth = request.headers.get("authorization");
  return auth === `Bearer ${secret}`;
}

/** Vercel Cron: process scan jobs + purge expired cache */
export async function GET(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const purged = await purgeExpiredCache();
  const job = await claimNextJob();

  if (!job) {
    return NextResponse.json({ message: "No pending jobs", purged });
  }

  try {
    let result: Record<string, unknown>;

    if (job.jobType === "universe_underlying_scan") {
      const scan = await analyzeUniverse();
      result = {
        analyzed: scan.analyzed,
        failed: scan.failed,
      };
    } else {
      result = {
        message: `Job ${job.jobType} acknowledged — full scanner in Phase 4+`,
        payload: job.payload,
      };
    }

    await completeJob(job.id, result);
    return NextResponse.json({
      processed: job.id,
      jobType: job.jobType,
      result,
      purged,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Job failed";
    await failJob(job.id, msg);
    return NextResponse.json({ error: msg, jobId: job.id, purged }, { status: 500 });
  }
}
