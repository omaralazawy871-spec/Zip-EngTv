import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
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
  GetSourceSyncHistoryParams,
  GetSourceSyncHistoryResponse,
  SyncAllSourcesResponse,
  GetSyncHistoryResponse,
  GetAdminStatsResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { syncSource as doSyncSource } from "../lib/sync-engine";

const router: IRouter = Router();

// GET /admin/sources
router.get("/admin/sources", requireAdmin, async (_req, res): Promise<void> => {
  const sources = await db.select().from(sourcesTable);
  res.json(ListSourcesResponse.parse(sources));
});

// POST /admin/sources
router.post("/admin/sources", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateSourceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [source] = await db.insert(sourcesTable).values(parsed.data).returning();
  res.status(201).json(CreateSourceResponse.parse(source));
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

  res.json(GetSourceResponse.parse(source));
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

  const [source] = await db
    .update(sourcesTable)
    .set({ ...parsed.data, updated_at: new Date() })
    .where(eq(sourcesTable.id, params.data.id))
    .returning();

  if (!source) {
    res.status(404).json({ error: "المصدر غير موجود" });
    return;
  }

  res.json(UpdateSourceResponse.parse(source));
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
  res.json(SyncSourceResponse.parse(result));
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

  res.json(GetSourceSyncHistoryResponse.parse(history));
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

  res.json(GetSyncHistoryResponse.parse(history));
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
      total_categories: categories.length,
      total_sources: sources.length,
      active_sources: sources.filter((s) => s.status === "active").length,
      last_sync_at: lastSync[0]?.started_at?.toISOString() ?? null,
    })
  );
});

export default router;
