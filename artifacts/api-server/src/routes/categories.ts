import { Router, type IRouter } from "express";
import { eq, asc } from "drizzle-orm";
import { db, categoriesTable, channelsTable } from "@workspace/db";
import {
  ListCategoriesResponse,
  ListAdminCategoriesResponse,
  GetCategoryParams,
  GetCategoryResponse,
  CreateCategoryBody,
  CreateCategoryResponse,
  UpdateCategoryParams,
  UpdateCategoryBody,
  UpdateCategoryResponse,
  DeleteCategoryParams,
  ReorderCategoriesBody,
  ReorderCategoriesResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

// GET /categories - list visible only (public)
router.get("/categories", async (_req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.is_visible, true))
    .orderBy(asc(categoriesTable.sort_order), asc(categoriesTable.id));
  res.json(ListCategoriesResponse.parse(serializeDates(categories)));
});

// GET /categories/:id - get with channels (public)
router.get("/categories/:id", async (req, res): Promise<void> => {
  const params = GetCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [category] = await db
    .select()
    .from(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id));

  if (!category) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  const channels = await db
    .select()
    .from(channelsTable)
    .where(eq(channelsTable.category_id, params.data.id))
    .orderBy(asc(channelsTable.sort_order), asc(channelsTable.id));

  res.json(GetCategoryResponse.parse(serializeDates({ ...category, channels })));
});

// GET /admin/categories - list all including hidden (admin)
router.get("/admin/categories", requireAdmin, async (_req, res): Promise<void> => {
  const categories = await db
    .select()
    .from(categoriesTable)
    .orderBy(asc(categoriesTable.sort_order), asc(categoriesTable.id));
  res.json(ListAdminCategoriesResponse.parse(serializeDates(categories)));
});

// POST /admin/categories - create (admin)
router.post("/admin/categories", requireAdmin, async (req, res): Promise<void> => {
  const parsed = CreateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { sort_order, ...rest } = parsed.data;

  let finalOrder = sort_order;
  if (finalOrder === undefined || finalOrder === null) {
    const existing = await db.select().from(categoriesTable);
    finalOrder = existing.length;
  }

  const [category] = await db
    .insert(categoriesTable)
    .values({ ...rest, sort_order: finalOrder })
    .returning();

  res.status(201).json(CreateCategoryResponse.parse(serializeDates(category)));
});

// PATCH /admin/categories/reorder (must be before /:id)
router.patch("/admin/categories/reorder", requireAdmin, async (req, res): Promise<void> => {
  const parsed = ReorderCategoriesBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  for (const item of parsed.data.items) {
    await db
      .update(categoriesTable)
      .set({ sort_order: item.sort_order })
      .where(eq(categoriesTable.id, item.id));
  }

  res.json(ReorderCategoriesResponse.parse({ success: true }));
});

// PATCH /admin/categories/:id - update (admin)
router.patch("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = UpdateCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateCategoryBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData = Object.fromEntries(
    Object.entries(parsed.data).filter(([, v]) => v !== null),
  );
  const [category] = await db
    .update(categoriesTable)
    .set(updateData)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!category) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  res.json(UpdateCategoryResponse.parse(serializeDates(category)));
});

// DELETE /admin/categories/:id - delete (admin)
router.delete("/admin/categories/:id", requireAdmin, async (req, res): Promise<void> => {
  const params = DeleteCategoryParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [deleted] = await db
    .delete(categoriesTable)
    .where(eq(categoriesTable.id, params.data.id))
    .returning();

  if (!deleted) {
    res.status(404).json({ error: "التصنيف غير موجود" });
    return;
  }

  res.sendStatus(204);
});

export default router;
