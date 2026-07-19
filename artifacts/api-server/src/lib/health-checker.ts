import { inArray } from "drizzle-orm";
import { db, channelsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const DEFAULT_TIMEOUT_MS = 8000;
const DEFAULT_CONCURRENCY = 10;
const MAX_CONCURRENCY = 30;

const CONCURRENCY = Math.min(
  Number(process.env["HEALTH_CHECK_CONCURRENCY"]) || DEFAULT_CONCURRENCY,
  MAX_CONCURRENCY
);

interface CheckResult {
  id: number;
  healthy: boolean;
  error: string | null;
}

async function checkStreamUrl(url: string): Promise<{ healthy: boolean; error: string | null }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: {
        "User-Agent": "EngTv/1.0 (health-check)",
      },
      redirect: "manual",
    });

    response.body?.cancel().catch(() => {});
    clearTimeout(timer);

    if (response.status >= 200 && response.status < 300) {
      return { healthy: true, error: null };
    }

    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get("location");
      if (location) {
        // Follow redirect and check the destination
        try {
          const followRes = await fetch(location, {
            method: "GET",
            signal: AbortSignal.timeout(DEFAULT_TIMEOUT_MS),
            headers: { "User-Agent": "EngTv/1.0 (health-check)" },
          });
          followRes.body?.cancel().catch(() => {});
          if (followRes.ok) {
            return { healthy: true, error: null };
          }
          return { healthy: false, error: `Redirect to ${followRes.status}` };
        } catch {
          return { healthy: false, error: "Redirect target unreachable" };
        }
      }
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

  const workers = Array.from({ length: Math.min(CONCURRENCY, queue.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

export interface HealthCheckOptions {
  ids?: number[];
  concurrency?: number;
}

export interface HealthCheckSummary {
  checked: number;
  healthy: number;
  broken: number;
  skipped: number;
}

export async function runHealthCheck(options: HealthCheckOptions = {}): Promise<HealthCheckSummary> {
  const effectiveConcurrency = Math.min(
    options.concurrency ?? CONCURRENCY,
    MAX_CONCURRENCY
  );

  let channels: { id: number; stream_url: string }[];

  if (options.ids && options.ids.length > 0) {
    channels = await db
      .select({ id: channelsTable.id, stream_url: channelsTable.stream_url })
      .from(channelsTable)
      .where(inArray(channelsTable.id, options.ids));
  } else {
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

  const results = await runBatch(channels);

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
