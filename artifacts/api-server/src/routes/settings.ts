import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, settingsTable } from "@workspace/db";
import { GetSettingsResponse, UpdateSettingsBody, UpdateSettingsResponse } from "@workspace/api-zod";
import { requireAdmin } from "../middlewares/auth";

const router: IRouter = Router();

const SETTINGS_KEYS = ["app_name", "app_logo_url", "primary_color", "secondary_color", "footer_text"];

async function getSettingsObject(): Promise<Record<string, string | null>> {
  const rows = await db.select().from(settingsTable);
  const obj: Record<string, string | null> = {};
  for (const key of SETTINGS_KEYS) {
    obj[key] = null;
  }
  for (const row of rows) {
    obj[row.key] = row.value;
  }
  // Default app_name if not set
  if (!obj["app_name"]) obj["app_name"] = "EngTv";
  return obj;
}

// GET /settings (public)
router.get("/settings", async (_req, res): Promise<void> => {
  const settings = await getSettingsObject();
  res.json(GetSettingsResponse.parse(settings));
});

// PATCH /admin/settings (admin)
router.patch("/admin/settings", requireAdmin, async (req, res): Promise<void> => {
  const parsed = UpdateSettingsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  for (const [key, value] of Object.entries(parsed.data)) {
    if (!SETTINGS_KEYS.includes(key)) continue;
    if (value === null || value === undefined) {
      await db.delete(settingsTable).where(eq(settingsTable.key, key));
    } else {
      await db
        .insert(settingsTable)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: String(value) } });
    }
  }

  const updated = await getSettingsObject();
  res.json(UpdateSettingsResponse.parse(updated));
});

export default router;
