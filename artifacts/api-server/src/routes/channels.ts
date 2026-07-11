import { Router, type IRouter } from "express";
import { eq, asc, ilike, and } from "drizzle-orm";
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
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

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

  res.json(ListChannelsResponse.parse(channels));
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

  res.json(GetChannelResponse.parse(channel));
});

// GET /admin/channels - list all including inactive (admin)
router.get("/admin/channels", requireAdmin, async (req, res): Promise<void> => {
  const query = ListAdminChannelsQueryParams.safeParse(req.query);
  if (!query.success) {
    res.status(400).json({ error: query.error.message });
    return;
  }

  const { category_id, q, source_id } = query.data;
  const conditions = [];

  if (category_id !== undefined && category_id !== null) {
    conditions.push(eq(channelsTable.category_id, category_id));
  }
  if (source_id !== undefined && source_id !== null) {
    conditions.push(eq(channelsTable.source_id, source_id));
  }
  if (q && q.trim()) {
    conditions.push(ilike(channelsTable.name, `%${q.trim()}%`));
  }

  const channels = await db
    .select()
    .from(channelsTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(channelsTable.sort_order), asc(channelsTable.id));

  res.json(ListAdminChannelsResponse.parse(channels));
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

  res.status(201).json(CreateChannelResponse.parse(channel));
});

// PATCH /admin/channels/reorder (must be before /:id)
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

  res.json(UpdateChannelResponse.parse(channel));
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
