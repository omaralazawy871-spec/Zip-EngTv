import { Router, type IRouter } from "express";
import { eq, desc, gt, isNotNull } from "drizzle-orm";
import { db, sourcesTable, syncHistoryTable, channelsTable, categoriesTable } from "@workspace/db";
import {
  ListSourcesResponse,
  GetSourceParams,
  GetSourceResponse,
  CreateSourceBody,
  CreateSourceResponse,
  UpdateSourceParams,
  UpdateSourceBody,
  UpdateSourceResponse,
  DeleteSourceParams,
  SyncSourceParams,
  SyncSourceResponse,
  RetrySyncSourceParams,
  RetrySyncSourceResponse,
  GetSourceSyncHistoryParams,
  GetSourceSyncHistoryResponse,
  SyncAllSourcesResponse,
  GetSyncHistoryResponse,
  GetAdminStatsResponse,
  GetSchedulerStatusResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { syncSource as doSyncSource } from "../lib/sync-engine";
import { serializeDates } from "../lib/serialize";
import { encrypt } from "../lib/crypto";

const router: IRouter = Router();

// GET /admin/sources
router.get("/admin/sources", requireAdmin, async (_req, res): Promise<void> => {
  const sources = await db.select().from(sourcesTable);
  res.json(ListSourcesResponse.parse(serializeDates(sources)));
});

// POST /admin/sources
router.post("/admin/sources", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // If sync_interval_hours > 0, set next_sync_at
  const intervalHours = parsed.data.sync_interval_hours ?? 0;
  const nextSyncAt = intervalHours > 0
    ? new Date(Date.now() + intervalHours * 60 * 60 * 1000)
    : null;

  const values = {
    ...parsed.data,
    next_sync_at: nextSyncAt,
    password: parsed.data.password ? encrypt(parsed.data.password) : undefined,
  };

  const [source] = await db
    .insert(sourcesTable)
    .values(values)
    .returning();
  res.status(201).json(CreateSourceResponse.parse(serializeDates(source)));
});

// GET /admin/sources/:id
router.get("/admin/sources/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = GetSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db
    .select()
    .from(sourcesTable)
    .where(eq(sourcesTable.id, params.data.id));

  if (!source) {
    res.status(404).json({ error: "المصدر غير موجود" });
    return;
  }

  res.json(GetSourceResponse.parse(serializeDates(source)));
});

// PATCH /admin/sources/:id
router.patch("/admin/sources/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  // If interval is changing, recalculate next_sync_at
  let nextSyncAt: Date | null | undefined;
  if (parsed.data.sync_interval_hours !== undefined) {
    const intervalHours = parsed.data.sync_interval_hours;
    nextSyncAt = intervalHours > 0
      ? new Date(Date.now() + intervalHours * 60 * 60 * 1000)
      : null;
  }

  const setData = {
    ...Object.fromEntries(Object.entries(parsed.data).filter(([, v]) => v !== null)),
    updated_at: new Date(),
    ...(nextSyncAt !== undefined ? { next_sync_at: nextSyncAt } : {}),
    ...(parsed.data.password ? { password: encrypt(parsed.data.password) } : {}),
  };

  const [source] = await db
    .update(sourcesTable)
    .set(setData)
    .where(eq(sourcesTable.id, params.data.id))
    .returning();

  if (!source) {
    res.status(404).json({ error: "المصدر غير موجود" });
    return;
  }

  res.json(UpdateSourceResponse.parse(serializeDates(source)));
});

// POST /admin/sources/test — test connection before saving
router.post("/admin/sources/test", requireAdmin, async (req, res): Promise<void> => {
  const { type, url, server_url, username, password } = req.body as Record<string, string | undefined>;

  if (type !== "m3u" && type !== "xtream") {
    res.status(400).json({ error: "نوع مصدر غير صالح" });
    return;
  }

  try {
    if (type === "m3u") {
      if (!url) {
        res.json({ success: false, message: "M3U URL مطلوب" });
        return;
      }
      const response = await fetch(url, {
        method: "HEAD",
        headers: { "User-Agent": "EngTv/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (response.ok) {
        res.json({ success: true, message: "تم الاتصال بنجاح" });
      } else {
        res.json({ success: false, message: `HTTP ${response.status}: ${response.statusText}` });
      }
    } else {
      if (!server_url || !username || !password) {
        res.json({ success: false, message: "بيانات Xtream Codes غير مكتملة" });
        return;
      }
      const base = server_url.replace(/\/$/, "");
      const [catRes] = await Promise.all([
        fetch(
          `${base}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`,
          { signal: AbortSignal.timeout(15000) }
        ),
      ]);
      if (catRes.ok) {
        const data = await catRes.json();
        if (Array.isArray(data)) {
          res.json({ success: true, message: `تم الاتصال — ${data.length} فئة متاحة` });
        } else {
          res.json({ success: false, message: "استجابة غير متوقعة من الخادم" });
        }
      } else {
        res.json({ success: false, message: `HTTP ${catRes.status}: ${catRes.statusText}` });
      }
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "خطأ في الاتصال";
    res.json({ success: false, message: msg });
  }
});

// DELETE /admin/sources/:id
router.delete("/admin/sources/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(sourcesTable)
    .where(eq(sourcesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "المصدر غير موجود" });
    return;
  }

  res.sendStatus(204);
});

// POST /admin/sources/:id/sync
router.post("/admin/sources/:id/sync", requireAdmin, async (req, res): Promise<void> => {
  const params = SyncSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db
    .select()
    .from(sourcesTable)
    .where(eq(sourcesTable.id, params.data.id));

  if (!source) {
    res.status(404).json({ error: "المصدر غير موجود" });
    return;
  }

  const result = await doSyncSource(source);
  res.json(SyncSourceResponse.parse(serializeDates(result)));
});

// POST /admin/sources/:id/retry — retry the last failed sync
router.post("/admin/sources/:id/retry", requireAdmin, async (req, res): Promise<void> => {
  const params = RetrySyncSourceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [source] = await db
    .select()
    .from(sourcesTable)
    .where(eq(sourcesTable.id, params.data.id));

  if (!source) {
    res.status(404).json({ error: "المصدر غير موجود" });
    return;
  }

  // Force retry (bypass the auto-retry-once guard)
  const result = await doSyncSource(source, false);
  res.json(RetrySyncSourceResponse.parse(serializeDates(result)));
});

// GET /admin/sources/:id/sync-history
router.get("/admin/sources/:id/sync-history", requireAdmin, async (req, res): Promise<void> => {
  const params = GetSourceSyncHistoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const history = await db
    .select()
    .from(syncHistoryTable)
    .where(eq(syncHistoryTable.source_id, params.data.id))
    .orderBy(desc(syncHistoryTable.started_at))
    .limit(50);

  res.json(GetSourceSyncHistoryResponse.parse(serializeDates(history)));
});

// POST /admin/sync - sync all active sources
router.post("/admin/sync", requireAdmin, async (_req, res): Promise<void> => {
  const sources = await db
    .select()
    .from(sourcesTable)
    .where(eq(sourcesTable.status, "active"));

  let totalChannels = 0;
  let totalCategories = 0;
  const errors: string[] = [];

  for (const source of sources) {
    const result = await doSyncSource(source);
    if (result.success) {
      totalChannels += result.channels_imported;
      totalCategories += result.categories_imported;
    } else {
      errors.push(`${source.name}: ${result.error_message || "فشل المزامنة"}`);
    }
  }

  res.json(
    SyncAllSourcesResponse.parse({
      success: errors.length === 0,
      total_channels: totalChannels,
      total_categories: totalCategories,
      sources_synced: sources.length,
      errors,
    })
  );
});

// GET /admin/sync-history - full history
router.get("/admin/sync-history", requireAdmin, async (_req, res): Promise<void> => {
  const history = await db
    .select()
    .from(syncHistoryTable)
    .orderBy(desc(syncHistoryTable.started_at))
    .limit(100);

  res.json(GetSyncHistoryResponse.parse(serializeDates(history)));
});

// GET /admin/scheduler - scheduler status
router.get("/admin/scheduler", requireAdmin, async (_req, res): Promise<void> => {
  const sources = await db.select().from(sourcesTable);
  const scheduledSources = sources
    .filter((s) => (s.sync_interval_hours ?? 0) > 0)
    .map((s) => ({
      source_id: s.id,
      source_name: s.name,
      sync_interval_hours: s.sync_interval_hours ?? 0,
      next_sync_at: s.next_sync_at ? s.next_sync_at.toISOString() : null,
      last_sync_at: s.last_sync_at ? s.last_sync_at.toISOString() : null,
    }));

  res.json(
    GetSchedulerStatusResponse.parse({
      enabled: scheduledSources.length > 0,
      scheduled_sources: scheduledSources,
    })
  );
});

// GET /admin/stats - dashboard stats
router.get("/admin/stats", requireAdmin, async (_req, res): Promise<void> => {
  const channels = await db.select().from(channelsTable);
  const categories = await db.select().from(categoriesTable);
  const sources = await db.select().from(sourcesTable);
  const lastSync = await db
    .select()
    .from(syncHistoryTable)
    .orderBy(desc(syncHistoryTable.started_at))
    .limit(1);

  res.json(
    GetAdminStatsResponse.parse({
      total_channels: channels.length,
      active_channels: channels.filter((c) => c.is_active).length,
      healthy_channels: channels.filter((c) => c.is_healthy === true).length,
      broken_channels: channels.filter((c) => c.is_healthy === false).length,
      total_categories: categories.length,
      total_sources: sources.length,
      active_sources: sources.filter((s) => s.status === "active").length,
      last_sync_at: lastSync[0]?.started_at?.toISOString() ?? null,
    })
  );
});

export default router;
