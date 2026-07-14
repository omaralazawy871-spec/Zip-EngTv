import { lt, eq, and, isNotNull } from "drizzle-orm";
import { db, sourcesTable } from "@workspace/db";
import { logger } from "./logger";
import { syncSource } from "./sync-engine";

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

const CHECK_INTERVAL_MS = 60 * 1000; // check every minute

async function runScheduledSyncs(): Promise<void> {
  if (isRunning) return; // prevent overlap
  isRunning = true;

  try {
    const now = new Date();

    // Find sources that have auto-sync enabled and are due
    const dueSources = await db
      .select()
      .from(sourcesTable)
      .where(
        and(
          eq(sourcesTable.status, "active"),
          isNotNull(sourcesTable.next_sync_at),
          lt(sourcesTable.next_sync_at, now)
        )
      );

    if (dueSources.length > 0) {
      logger.info({ count: dueSources.length }, "Scheduler: running due syncs");

      for (const source of dueSources) {
        try {
          const result = await syncSource(source);
          logger.info(
            { sourceId: source.id, sourceName: source.name, result },
            "Scheduler: sync completed"
          );
        } catch (err) {
          logger.error(
            { err, sourceId: source.id, sourceName: source.name },
            "Scheduler: sync error"
          );
        }
      }
    }
  } catch (err) {
    logger.error({ err }, "Scheduler: error during check");
  } finally {
    isRunning = false;
  }
}

export function startScheduler(): void {
  if (schedulerTimer) return;
  schedulerTimer = setInterval(runScheduledSyncs, CHECK_INTERVAL_MS);
  // Run once immediately to catch any overdue syncs on startup
  runScheduledSyncs().catch(() => {});
  logger.info("Scheduler started");
}

export function stopScheduler(): void {
  if (schedulerTimer) {
    clearInterval(schedulerTimer);
    schedulerTimer = null;
    logger.info("Scheduler stopped");
  }
}
