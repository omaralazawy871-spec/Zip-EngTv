import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const secret = process.env["ADMIN_JWT_SECRET"] || "engtv-dev-secret";

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
