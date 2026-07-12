import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

function resolveSecret(): string {
  const envSecret = process.env["ADMIN_JWT_SECRET"];
  if (envSecret) return envSecret;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "ADMIN_JWT_SECRET environment variable is required but was not provided in production."
    );
  }
  return "engtv-dev-secret";
}

const secret = resolveSecret();

export function generateToken(): string {
  return jwt.sign({ admin: true }, secret, { expiresIn: "7d" });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers["authorization"];
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "غير مصرح" });
    return;
  }

  const token = authHeader.slice(7);
  if (!verifyToken(token)) {
    res.status(401).json({ error: "الرمز غير صالح أو منتهي الصلاحية" });
    return;
  }

  next();
}
