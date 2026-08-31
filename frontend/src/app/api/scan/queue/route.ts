import { NextResponse } from "next/server";
import {
  enqueueScanJob,
  getQueueStats,
  claimNextJob,
  completeJob,
  failJob,
} from "@/services/scan-queue";

export const dynamic = "force-dynamic";

export async function GET() {
  const stats = await getQueueStats();
  return NextResponse.json(stats);
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const { jobType, payload, priority } = body as {
    jobType?: string;
    payload?: Record<string, unknown>;
    priority?: number;
  };

  if (!jobType) {
    return NextResponse.json({ error: "jobType required" }, { status: 400 });
  }

  const id = await enqueueScanJob({ jobType, payload, priority });
  if (!id) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ id, status: "pending" });
}

/** Process one pending job manually */
export async function PATCH(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const job = await claimNextJob();
  if (!job) {
    return NextResponse.json({ message: "No pending jobs" });
  }

  try {
    // Phase 3 will implement actual scan logic per jobType
    await completeJob(job.id, {
      message: `Job ${job.jobType} acknowledged — scanner logic in Phase 3`,
      payload: job.payload,
    });
    return NextResponse.json({ processed: job.id, jobType: job.jobType });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Job failed";
    await failJob(job.id, msg);
    return NextResponse.json({ error: msg, jobId: job.id }, { status: 500 });
  }
}
