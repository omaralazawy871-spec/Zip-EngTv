import { inArray } from "drizzle-orm";
import { db, channelsTable } from "@workspace/db";
import { eq, and, isNull, or } from "drizzle-orm";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 10;
const MAX_CONCURRENCY = 30;

interface CheckResult {
  id: number;
  healthy: boolean;
  error: string | null;
}

async function checkStreamUrl(url: string): Promise<{ healthy: boolean; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    // Always use GET — HEAD is unreliable on live-stream endpoints (many
    // Xtream / HLS servers return 404 or 405 for HEAD even when the stream
    // is healthy).  Do NOT send a Range header; live streams don't support
    // range requests and servers often return 416 for them.
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "EngTv/1.0 (health-check)",
      },
    });

    // Abort the body immediately — we only care about the status code.
    response.body?.cancel().catch(() => {});
    clearTimeout(timer);

    if (response.status >= 200 && response.status < 400) {
      return { healthy: true, error: null };
    }

    return { healthy: false, error: `HTTP ${response.status}` };
  } catch (err) {
    clearTimeout(timer);
    if (err instanceof Error) {
      if (err.name === "AbortError") return { healthy: false, error: "انتهى وقت الاتصال" };
      return { healthy: false, error: err.message.slice(0, 120) };
    }
    return { healthy: false, error: "خطأ غير معروف" };
  }
}

async function runBatch(
  channels: { id: number; stream_url: string }[],
  concurrency: number
): Promise<CheckResult[]> {
  const results: CheckResult[] = [];
  const queue = [...channels];

  async function worker() {
    while (queue.length > 0) {
      const ch = queue.shift()!;
      const { healthy, error } = await checkStreamUrl(ch.stream_url);
      results.push({ id: ch.id, healthy, error });
    }
  }

  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export interface HealthCheckOptions {
  ids?: number[]; // specific IDs; if empty, checks all active channels
  concurrency?: number;
}

export interface HealthCheckSummary {
  checked: number;
  healthy: number;
  broken: number;
  skipped: number;
}

export async function runHealthCheck(options: HealthCheckOptions = {}): Promise<HealthCheckSummary> {
  const concurrency = Math.min(
    options.concurrency ?? DEFAULT_CONCURRENCY,
    MAX_CONCURRENCY
  );

  // Fetch channels to check
  let channels: { id: number; stream_url: string }[];

  if (options.ids && options.ids.length > 0) {
    channels = await db
      .select({ id: channelsTable.id, stream_url: channelsTable.stream_url })
      .from(channelsTable)
      .where(inArray(channelsTable.id, options.ids));
  } else {
    // Check all active channels
    channels = await db
      .select({ id: channelsTable.id, stream_url: channelsTable.stream_url })
      .from(channelsTable)
      .where(eq(channelsTable.is_active, true));
  }

  const skipped = (options.ids?.length ?? 0) > channels.length
    ? (options.ids!.length - channels.length)
    : 0;

  if (channels.length === 0) {
    return { checked: 0, healthy: 0, broken: 0, skipped };
  }

  const results = await runBatch(channels, concurrency);

  // Write results back to DB in batches
  const now = new Date();
  const healthyIds = results.filter((r) => r.healthy).map((r) => r.id);
  const brokenResults = results.filter((r) => !r.healthy);

  if (healthyIds.length > 0) {
    await db
      .update(channelsTable)
      .set({ is_healthy: true, health_error: null, last_checked_at: now })
      .where(inArray(channelsTable.id, healthyIds));
  }

  for (const br of brokenResults) {
    await db
      .update(channelsTable)
      .set({ is_healthy: false, health_error: br.error, last_checked_at: now })
      .where(eq(channelsTable.id, br.id));
  }

  return {
    checked: results.length,
    healthy: healthyIds.length,
    broken: brokenResults.length,
    skipped,
  };
}
