import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

describe("Sources routes", () => {
  let app: express.Express;
  let token: string;

  beforeEach(async () => {
    vi.clearAllMocks();
    const { default: router } = await import("../../routes/sources");
    const { generateToken } = await import("../../middlewares/auth");

    app = express();
    app.use(express.json());
    app.use("/api", router);

    token = generateToken();
  });

  describe("GET /api/admin/sources", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app).get("/api/admin/sources");
      expect(res.status).toBe(401);
    });

    it("should return sources list", async () => {
      const res = await request(app)
        .get("/api/admin/sources")
        .set("Authorization", `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe("POST /api/admin/sources", () => {
    it("should create a source", async () => {
      const { db } = await import("@workspace/db");
      (db.returning as any).mockResolvedValue([
        { id: 1, name: "Test Source", type: "m3u" as const, status: "active" as const, filter_language: "all" as const, sync_interval_hours: 24 },
      ]);

      const res = await request(app)
        .post("/api/admin/sources")
        .set("Authorization", `Bearer ${token}`)
        .send({
          name: "Test Source",
          type: "m3u",
          url: "http://example.com/playlist.m3u",
          status: "active",
          sync_interval_hours: 24,
        });

      expect(res.status).toBe(201);
      expect(res.body.name).toBe("Test Source");
    });

    it("should return 400 for missing name", async () => {
      const res = await request(app)
        .post("/api/admin/sources")
        .set("Authorization", `Bearer ${token}`)
        .send({ type: "m3u" });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/admin/sources/test", () => {
    it("should return 401 without auth", async () => {
      const res = await request(app)
        .post("/api/admin/sources/test")
        .send({ type: "m3u", url: "http://example.com" });
      expect(res.status).toBe(401);
    });
  });
});
