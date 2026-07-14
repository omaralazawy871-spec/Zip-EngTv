import { Router, type IRouter } from "express";
import { eq, asc, ilike, and, inArray } from "drizzle-orm";
import { db, channelsTable } from "@workspace/db";
import {
  ListChannelsQueryParams,
  ListChannelsResponse,
  ListAdminChannelsQueryParams,
  ListAdminChannelsResponse,
  GetChannelParams,
  GetChannelResponse,
  CreateChannelBody,
  CreateChannelResponse,
  UpdateChannelParams,
  UpdateChannelBody,
  UpdateChannelResponse,
  DeleteChannelParams,
  ReorderChannelsBody,
  ReorderChannelsResponse,
  BulkDeleteChannelsBody,
  BulkDeleteChannelsResponse,
  BulkUpdateChannelStatusBody,
  BulkUpdateChannelStatusResponse,
  RunHealthCheckBody,
  RunHealthCheckResponse,
  DeleteAllChannelsResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { serializeDates } from "../lib/serialize";
import { runHealthCheck } from "../lib/health-checker";

const router: IRouter = Router();

// GET /channels - list active channels with filters (public)
router.get("/channels", async (req, res): Promise<void> => {
  const query = ListChannelsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category_id, q, active_only } = query.data;
  const conditions = [];

  if (category_id !== undefined && category_id !== null) {
    conditions.push(eq(channelsTable.category_id, category_id));
  }
  if (active_only) {
    conditions.push(eq(channelsTable.is_active, true));
  }
  if (q && q.trim()) {
    conditions.push(ilike(channelsTable.name, `%${q.trim()}%`));
  }

  const channels = await db
    .select()
    .from(channelsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(channelsTable.sort_order), asc(channelsTable.id));

  res.json(ListChannelsResponse.parse(serializeDates(channels)));
});

// GET /channels/:id (public)
router.get("/channels/:id", async (req, res): Promise<void> => {
  const params = GetChannelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [channel] = await db
    .select()
    .from(channelsTable)
    .where(eq(channelsTable.id, params.data.id));

  if (!channel) {
    res.status(404).json({ error: "القناة غير موجودة" });
    return;
  }

  res.json(GetChannelResponse.parse(serializeDates(channel)));
});

// GET /admin/channels - list all including inactive, advanced filters (admin)
router.get("/admin/channels", requireAdmin, async (req, res): Promise<void> => {
  const query = ListAdminChannelsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category_id, q, source_id, language, country, is_active, is_healthy } = query.data;
  const conditions = [];

  if (category_id !== undefined && category_id !== null) {
    conditions.push(eq(channelsTable.category_id, category_id));
  }
  if (source_id !== undefined && source_id !== null) {
    conditions.push(eq(channelsTable.source_id, source_id));
  }
  if (language) {
    conditions.push(eq(channelsTable.language, language));
  }
  if (country) {
    conditions.push(ilike(channelsTable.country, country));
  }
  if (is_active !== undefined && is_active !== null) {
    conditions.push(eq(channelsTable.is_active, is_active));
  }
  if (is_healthy !== undefined && is_healthy !== null) {
    conditions.push(eq(channelsTable.is_healthy, is_healthy));
  }
  if (q && q.trim()) {
    conditions.push(ilike(channelsTable.name, `%${q.trim()}%`));
  }

  const channels = await db
    .select()
    .from(channelsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(channelsTable.sort_order), asc(channelsTable.id));

  res.json(ListAdminChannelsResponse.parse(serializeDates(channels)));
});

// POST /admin/channels - create (admin)
router.post("/admin/channels", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateChannelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sort_order, ...rest } = parsed.data;

  let finalOrder = sort_order;
  if (finalOrder === undefined || finalOrder === null) {
    const existing = await db.select().from(channelsTable);
    finalOrder = existing.length;
  }

  const [channel] = await db
    .insert(channelsTable)
    .values({ ...rest, sort_order: finalOrder })
    .returning();

  res.status(201).json(CreateChannelResponse.parse(serializeDates(channel)));
});

// DELETE /admin/channels - delete ALL channels (requires confirm header)
router.delete("/admin/channels", requireAdmin, async (req, res): Promise<void> => {
  const confirm = req.headers["x-confirm-delete-all"];
  if (confirm !== "yes") {
    res.status(400).json({ error: "يجب تأكيد الحذف عبر الترويسة x-confirm-delete-all: yes" });
    return;
  }

  const deleted = await db.delete(channelsTable).returning({ id: channelsTable.id });
  res.json(DeleteAllChannelsResponse.parse({ deleted_count: deleted.length }));
});

// PATCH /admin/channels/reorder (must come before /:id)
router.patch("/admin/channels/reorder", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ReorderChannelsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  for (const item of parsed.data.items) {
    await db
      .update(channelsTable)
      .set({ sort_order: item.sort_order })
      .where(eq(channelsTable.id, item.id));
  }

  res.json(ReorderChannelsResponse.parse({ success: true }));
});

// POST /admin/channels/bulk-delete
router.post("/admin/channels/bulk-delete", requireAdmin, async (req, res): Promise<void> => {
  const parsed = BulkDeleteChannelsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const deleted = await db
    .delete(channelsTable)
    .where(inArray(channelsTable.id, parsed.data.ids))
    .returning({ id: channelsTable.id });

  res.json(BulkDeleteChannelsResponse.parse({ deleted_count: deleted.length }));
});

// POST /admin/channels/bulk-status
router.post("/admin/channels/bulk-status", requireAdmin, async (req, res): Promise<void> => {
  const parsed = BulkUpdateChannelStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updated = await db
    .update(channelsTable)
    .set({ is_active: parsed.data.is_active })
    .where(inArray(channelsTable.id, parsed.data.ids))
    .returning({ id: channelsTable.id });

  res.json(BulkUpdateChannelStatusResponse.parse({ updated_count: updated.length }));
});

// POST /admin/channels/health-check
router.post("/admin/channels/health-check", requireAdmin, async (req, res): Promise<void> => {
  const parsed = RunHealthCheckBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const result = await runHealthCheck({
    ids: parsed.data.ids,
    concurrency: parsed.data.concurrency,
  });

  res.json(RunHealthCheckResponse.parse(result));
});

// PATCH /admin/channels/:id - update (admin)
router.patch("/admin/channels/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateChannelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateChannelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [channel] = await db
    .update(channelsTable)
    .set(parsed.data)
    .where(eq(channelsTable.id, params.data.id))
    .returning();

  if (!channel) {
    res.status(404).json({ error: "القناة غير موجودة" });
    return;
  }

  res.json(UpdateChannelResponse.parse(serializeDates(channel)));
});

// DELETE /admin/channels/:id - delete (admin)
router.delete("/admin/channels/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteChannelParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(channelsTable)
    .where(eq(channelsTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "القناة غير موجودة" });
    return;
  }

  res.sendStatus(204);
});

export default router;
