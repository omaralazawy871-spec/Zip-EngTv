import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

describe("Backup / Restore routes", () => {
  let app: express.Express;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: router } = await import("../../routes/backup");
    const { generateToken } = await import("../../middlewares/auth");

    app = express();
    app.use(express.json({ limit: "50mb" }));
    app.use("/api", router);

    token = generateToken();
  });

  describe("GET /api/admin/backup", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/admin/backup");
      expect(res.status).toBe(401);
    });

    it("should return full backup data", async () => {
      const res = await request(app)
        .get("/api/admin/backup")
        .set("Authorization", `Bearer ${token}`);

      if (res.status !== 200) {
        console.error("Backup test body:", JSON.stringify(res.body));
      }
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("exported_at");
      expect(res.body).toHaveProperty("channels");
      expect(res.body).toHaveProperty("categories");
      expect(res.body).toHaveProperty("sources");
      expect(res.body).toHaveProperty("settings");
      expect(Array.isArray(res.body.channels)).toBe(true);
    });
  });

  describe("POST /api/admin/restore", () => {
    const validBackup = {
      exported_at: new Date().toISOString(),
      channels: [
        {
          id: 1,
          name: "Test Channel",
          stream_url: "http://example.com/stream",
          logo_url: null,
          category_id: null,
          source_id: null,
          external_id: null,
          is_active: true,
          sort_order: 0,
          language: "en",
          country: null,
          created_at: new Date().toISOString(),
          last_checked_at: null,
          is_healthy: null,
          health_error: null,
        },
      ],
      categories: [],
      sources: [],
      settings: [],
    };

    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post("/api/admin/restore")
        .send(validBackup);
      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid body", async () => {
      const res = await request(app)
        .post("/api/admin/restore")
        .set("Authorization", `Bearer ${token}`)
        .send({ invalid: true });

      expect(res.status).toBe(400);
    });

    it("should restore data successfully", async () => {
      const { db } = await import("@workspace/db");
      (db.returning as any).mockResolvedValue([{ id: 1 }]);
      (db.execute as any).mockResolvedValue(undefined);

      const res = await request(app)
        .post("/api/admin/restore")
        .set("Authorization", `Bearer ${token}`)
        .send(validBackup);

      expect(res.status).toBe(200);
      expect(res.body.channels_imported).toBe(1);
      expect(res.body.categories_imported).toBe(0);
      expect(res.body.sources_imported).toBe(0);
      expect(res.body.settings_imported).toBe(0);
      expect(res.body).toHaveProperty("restored_at");
    });
  });
});
