import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

describe("Channel routes", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: router } = await import("../../routes/channels");
    const { generateToken } = await import("../../middlewares/auth");

    app = express();
    app.use(express.json());
    app.use("/api", router);

    // Create a valid token for admin routes
    const token = generateToken();
    (globalThis as any).__testToken = token;
  });

  describe("GET /api/channels (public)", () => {
    it("should return 200 with empty list when no channels exist", async () => {
      const res = await request(app)
        .get("/api/channels")
        .expect("Content-Type", /json/);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/admin/channels/bulk-category", () => {
    it("should return 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/admin/channels/bulk-category")
        .send({ ids: [1], category_id: 2 });

      expect(res.status).toBe(401);
    });

    it("should return 400 for invalid body", async () => {
      const token = (globalThis as any).__testToken;
      const res = await request(app)
        .post("/api/admin/channels/bulk-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ ids: [], category_id: 2 });

      expect(res.status).toBe(400);
    });

    it("should return 200 for valid request", async () => {
      const token = (globalThis as any).__testToken;
      const { db } = await import("@workspace/db");
      (db.returning as any).mockResolvedValue([{ id: 1 }]);

      const res = await request(app)
        .post("/api/admin/channels/bulk-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ ids: [1, 2], category_id: 5 });

      expect(res.status).toBe(200);
      expect(res.body.updated_count).toBe(1);
    });

    it("should clear category when category_id is null", async () => {
      const token = (globalThis as any).__testToken;
      const { db } = await import("@workspace/db");
      (db.returning as any).mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const res = await request(app)
        .post("/api/admin/channels/bulk-category")
        .set("Authorization", `Bearer ${token}`)
        .send({ ids: [1, 2], category_id: null });

      expect(res.status).toBe(200);
      expect(res.body.updated_count).toBe(2);
    });
  });

  describe("GET /api/channels/:id", () => {
    it("should return 404 for non-existent channel", async () => {
      const res = await request(app)
        .get("/api/channels/999")
        .expect("Content-Type", /json/);

      expect(res.status).toBe(404);
    });
  });
});
