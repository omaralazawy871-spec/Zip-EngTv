import { describe, it, expect, vi } from "vitest";
import { generateToken, verifyToken, requireAdmin } from "../middlewares/auth";
import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

describe("auth", () => {
  describe("generateToken", () => {
    it("should generate a valid JWT token", () => {
      const token = generateToken();
      expect(typeof token).toBe("string");
      expect(token.split(".")).toHaveLength(3);
    });
  });

  describe("verifyToken", () => {
    it("should verify a valid token", () => {
      const token = generateToken();
      expect(verifyToken(token)).toBe(true);
    });

    it("should reject an invalid token", () => {
      expect(verifyToken("invalid-token")).toBe(false);
    });

    it("should reject an expired token", () => {
      const expired = jwt.sign({ admin: true }, "test-secret-key", { expiresIn: "0s" });
      expect(verifyToken(expired)).toBe(false);
    });
  });

  describe("requireAdmin", () => {
    function createReq(authHeader?: string): Partial<Request> {
      return { headers: { authorization: authHeader } };
    }

    function createRes(): Partial<Response> {
      const res: Partial<Response> = {};
      res.status = vi.fn().mockReturnValue(res);
      res.json = vi.fn().mockReturnValue(res);
      return res;
    }

    it("should call next() for valid token", () => {
      const token = generateToken();
      const req = createReq(`Bearer ${token}`) as Request;
      const res = createRes() as Response;
      const next = vi.fn() as NextFunction;

      requireAdmin(req, res, next);
      expect(next).toHaveBeenCalledOnce();
      expect(res.status).not.toHaveBeenCalled();
    });

    it("should return 401 for missing header", () => {
      const req = createReq(undefined) as Request;
      const res = createRes() as Response;
      const next = vi.fn() as NextFunction;

      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it("should return 401 for non-Bearer header", () => {
      const req = createReq("Basic abc") as Request;
      const res = createRes() as Response;
      const next = vi.fn() as NextFunction;

      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it("should return 401 for invalid token", () => {
      const req = createReq("Bearer invalid") as Request;
      const res = createRes() as Response;
      const next = vi.fn() as NextFunction;

      requireAdmin(req, res, next);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
