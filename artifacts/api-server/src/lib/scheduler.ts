import { lt, eq, and, isNotNull } from "drizzle-orm";
import { db, sourcesTable } from "@workspace/db";
import { logger } from "./logger";
import { syncSource } from "./sync-engine";

let schedulerTimer: ReturnType<typeof setInterval> | null = null;
let isRunning = false;

const CHECK_INTERVAL_MS = 60 * 1000; // check every minute
const RECOVERY_RETRY_DELAY_MS = 30 * 60 * 1000; // retry failed sources after 30 min
const MAX_SYNC_RETRIES = 3;

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

    // Also find failed sources that are due for a recovery attempt
    const recoveryCutoff = new Date(Date.now() - RECOVERY_RETRY_DELAY_MS);
    const failedSources = await db
      .select()
      .from(sourcesTable)
      .where(
        and(
          eq(sourcesTable.status, "active"),
          eq(sourcesTable.sync_status, "failed"),
          lt(sourcesTable.last_sync_at, recoveryCutoff)
        )
      );

    // Merge and deduplicate
    const sourceIds = new Set<number>();
    const toSync = [...dueSources, ...failedSources].filter((s) => {
      if (sourceIds.has(s.id)) return false;
      sourceIds.add(s.id);
      return true;
    }).slice(0, 10); // limit concurrent syncs

    if (toSync.length > 0) {
      logger.info({ dueCount: dueSources.length, recoveryCount: failedSources.length, totalToSync: toSync.length }, "Scheduler: running due syncs");

      for (const source of toSync) {
        // Skip sources that have exceeded retry count
        if ((source.retry_count ?? 0) >= MAX_SYNC_RETRIES) {
          logger.warn({ sourceId: source.id, sourceName: source.name, retries: source.retry_count }, "Scheduler: skipping source — max retries exceeded");
          continue;
        }

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
