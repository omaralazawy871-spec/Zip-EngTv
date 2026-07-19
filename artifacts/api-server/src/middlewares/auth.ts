import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const resolvedSecret: string = process.env["ADMIN_JWT_SECRET"] ?? (() => {
  throw new Error(
    "ADMIN_JWT_SECRET environment variable is required but was not provided."
  );
})();

export function generateToken(): string {
  return jwt.sign({ admin: true }, resolvedSecret, { expiresIn: "7d" });
}

export function generateRefreshToken(): string {
  return jwt.sign({ admin: true, refresh: true }, resolvedSecret, { expiresIn: "30d" });
}

export function verifyToken(token: string): boolean {
  try {
    jwt.verify(token, resolvedSecret);
    return true;
  } catch {
    return false;
  }
}

export function verifyRefreshToken(token: string): boolean {
  try {
    const decoded = jwt.verify(token, resolvedSecret) as { refresh?: boolean };
    return decoded.refresh === true;
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
