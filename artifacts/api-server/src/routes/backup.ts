import { Router, type IRouter } from "express";
import { db, channelsTable, categoriesTable, sourcesTable, settingsTable } from "@workspace/db";
import { sql } from "drizzle-orm";
import {
  GetBackupResponse,
  RestoreBackupBody,
  RestoreBackupResponse,
  ExportBackupResponse,
} from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";
import { serializeDates } from "../lib/serialize";

const router: IRouter = Router();

// GET /admin/backup - export all data
router.get("/admin/backup", requireAdmin, async (req, res): Promise<void> => {
  const channels = await db.select().from(channelsTable).orderBy(channelsTable.sort_order, channelsTable.id);
  const categories = await db.select().from(categoriesTable).orderBy(categoriesTable.sort_order);
  const sources = await db.select().from(sourcesTable).orderBy(sourcesTable.id);
  const settings = await db.select().from(settingsTable);

  const data = {
    exported_at: new Date().toISOString(),
    channels: serializeDates(channels),
    categories: serializeDates(categories),
    sources: serializeDates(sources),
    settings,
  };

  res.json(GetBackupResponse.parse(data));
});

// POST /admin/restore - import data (replaces existing data)
router.post("/admin/restore", requireAdmin, async (req, res): Promise<void> => {
  const parsed = RestoreBackupBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { channels, categories, sources, settings } = parsed.data;

  // Use a transaction to replace all data
  await db.transaction(async (tx) => {
    // Clear existing data
    await tx.delete(channelsTable);
    await tx.delete(categoriesTable);
    await tx.delete(sourcesTable);
    await tx.delete(settingsTable);

    // Restore settings first (no foreign key dependencies)
    if (settings.length > 0) {
      await tx.insert(settingsTable).values(settings);
    }

    // Restore categories
    if (categories.length > 0) {
      const catValues = categories.map((c) => ({
        id: c.id,
        name: c.name,
        icon: c.icon,
        sort_order: c.sort_order,
        is_visible: c.is_visible,
        created_at: c.created_at ? new Date(c.created_at) : undefined,
      }));
      await tx.insert(categoriesTable).values(catValues);
      // Reset sequence
      await tx.execute(sql`SELECT setval('categories_id_seq', (SELECT COALESCE(MAX(id), 0) FROM categories))`);
    }

    // Restore sources
    if (sources.length > 0) {
      const srcValues = sources.map((s) => ({
        id: s.id,
        name: s.name,
        url: s.url,
        type: s.type,
        status: s.status,
        sync_interval_hours: s.sync_interval_hours,
        last_sync_at: s.last_sync_at ? new Date(s.last_sync_at) : null,
        error_message: s.error_message,
        created_at: s.created_at ? new Date(s.created_at) : undefined,
      }));
      await tx.insert(sourcesTable).values(srcValues);
      await tx.execute(sql`SELECT setval('sources_id_seq', (SELECT COALESCE(MAX(id), 0) FROM sources))`);
    }

    // Restore channels last (depends on categories and sources)
    if (channels.length > 0) {
      const chValues = channels.map((ch) => ({
        id: ch.id,
        name: ch.name,
        stream_url: ch.stream_url,
        logo_url: ch.logo_url,
        category_id: ch.category_id,
        source_id: ch.source_id,
        external_id: ch.external_id,
        is_active: ch.is_active,
        sort_order: ch.sort_order,
        language: ch.language,
        country: ch.country,
        created_at: ch.created_at ? new Date(ch.created_at) : undefined,
        last_checked_at: ch.last_checked_at ? new Date(ch.last_checked_at) : null,
        is_healthy: ch.is_healthy ?? null,
        health_error: ch.health_error,
      }));
      await tx.insert(channelsTable).values(chValues);
      await tx.execute(sql`SELECT setval('channels_id_seq', (SELECT COALESCE(MAX(id), 0) FROM channels))`);
    }
  });

  res.json(RestoreBackupResponse.parse({
    restored_at: new Date().toISOString(),
    channels_imported: channels.length,
    categories_imported: categories.length,
    sources_imported: sources.length,
    settings_imported: settings.length,
  }));
});

export default router;
