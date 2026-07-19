import { describe, it, expect, vi, beforeEach } from "vitest";
import request from "supertest";
import express from "express";

// Set env before importing the app
process.env.ADMIN_PASSWORD_HASH = "$2b$10$dummy"; // Not a real hash, test just validates flow

describe("POST /api/admin/login", () => {
  let app: express.Express;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Dynamic import to get fresh module per test
    const { default: router } = await import("../../routes/admin-auth");
    app = express();
    app.use(express.json());
    app.use("/api", router);
  });

  it("should return 400 for missing password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({})
      .expect("Content-Type", /json/);

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it("should return 401 for wrong password", async () => {
    const res = await request(app)
      .post("/api/admin/login")
      .send({ password: "wrong-password" })
      .expect("Content-Type", /json/);

    expect(res.status).toBe(401);
    expect(res.body.error).toBeDefined();
  });
});
