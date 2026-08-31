import { eq, asc, and, lte } from "drizzle-orm";
import { tryGetDb, schema } from "@/db";

const { scanQueue } = schema;

export type ScanJobStatus = "pending" | "running" | "completed" | "failed";

export interface EnqueueJobInput {
  jobType: string;
  payload?: Record<string, unknown>;
  priority?: number;
  scheduledAt?: Date;
}

export async function enqueueScanJob(
  input: EnqueueJobInput,
): Promise<number | null> {
  const db = tryGetDb();
  if (!db) return null;

  const [row] = await db
    .insert(scanQueue)
    .values({
      jobType: input.jobType,
      payload: input.payload ?? {},
      priority: input.priority ?? 0,
      scheduledAt: input.scheduledAt ?? new Date(),
      status: "pending",
    })
    .returning({ id: scanQueue.id });

  return row?.id ?? null;
}

export async function claimNextJob() {
  const db = tryGetDb();
  if (!db) return null;

  const now = new Date();
  const [job] = await db
    .select()
    .from(scanQueue)
    .where(
      and(eq(scanQueue.status, "pending"), lte(scanQueue.scheduledAt, now)),
    )
    .orderBy(asc(scanQueue.priority), asc(scanQueue.scheduledAt))
    .limit(1);

  if (!job) return null;

  await db
    .update(scanQueue)
    .set({ status: "running", startedAt: now })
    .where(eq(scanQueue.id, job.id));

  return { ...job, status: "running" as const, startedAt: now };
}

export async function completeJob(
  id: number,
  result?: Record<string, unknown>,
): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  await db
    .update(scanQueue)
    .set({
      status: "completed",
      completedAt: new Date(),
      result: result ?? null,
    })
    .where(eq(scanQueue.id, id));
}

export async function failJob(id: number, error: string): Promise<void> {
  const db = tryGetDb();
  if (!db) return;

  await db
    .update(scanQueue)
    .set({
      status: "failed",
      completedAt: new Date(),
      error,
    })
    .where(eq(scanQueue.id, id));
}

export async function getQueueStats() {
  const db = tryGetDb();
  if (!db) {
    return { pending: 0, running: 0, completed: 0, failed: 0 };
  }

  const rows = await db.select().from(scanQueue);
  return {
    pending: rows.filter((r) => r.status === "pending").length,
    running: rows.filter((r) => r.status === "running").length,
    completed: rows.filter((r) => r.status === "completed").length,
    failed: rows.filter((r) => r.status === "failed").length,
  };
}

/** Enqueue a full-universe scan job */
export async function enqueueUniverseScan(
  symbols: string[],
): Promise<number | null> {
  return enqueueScanJob({
    jobType: "universe_scan",
    payload: { symbols },
    priority: 10,
  });
}
