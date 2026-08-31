import { NextResponse } from "next/server";
import { claimNextJob, completeJob, failJob } from "@/services/scan-queue";
import { purgeExpiredCache } from "@/services/cache";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return process.env.NODE_ENV === "development";
  const auth = request.headers.get("authorization");
  // Vercel cron sends CRON_SECRET automatically in Authorization header
  return auth === `Bearer ${secret}`;
}

/** Vercel Cron: process one scan job + purge expired cache */
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
    await completeJob(job.id, {
      message: `Job ${job.jobType} acknowledged — scanner logic in Phase 3`,
      payload: job.payload,
    });
    return NextResponse.json({
      processed: job.id,
      jobType: job.jobType,
      purged,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Job failed";
    await failJob(job.id, msg);
    return NextResponse.json({ error: msg, jobId: job.id, purged }, { status: 500 });
  }
}
