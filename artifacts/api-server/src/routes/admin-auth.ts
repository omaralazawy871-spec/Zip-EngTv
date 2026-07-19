import { Router, type IRouter } from "express";
import rateLimit from "express-rate-limit";
import { generateToken, generateRefreshToken, verifyRefreshToken } from "../middlewares/auth";
import { AdminLoginBody, AdminLoginResponse, AdminRefreshBody, AdminRefreshResponse } from "@workspace/api-zod";

const router: IRouter = Router();

const adminPassword: string = process.env["ADMIN_PASSWORD"] ?? (() => {
  throw new Error(
    "ADMIN_PASSWORD environment variable is required but was not provided."
  );
})();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "محاولات تسجيل دخول كثيرة. حاول مرة أخرى بعد 15 دقيقة." },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "محاولات كثيرة. حاول مرة أخرى بعد 15 دقيقة." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/admin/login", loginLimiter, (req, res): void => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (parsed.data.password !== adminPassword) {
    res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    return;
  }

  const token = generateToken();
  const refreshToken = generateRefreshToken();
  res.json(AdminLoginResponse.parse({ token, refresh_token: refreshToken }));
});

// POST /admin/refresh — issue a new access token using a refresh token
router.post("/admin/refresh", refreshLimiter, (req, res): void => {
  const parsed = AdminRefreshBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  if (!verifyRefreshToken(parsed.data.refresh_token)) {
    res.status(401).json({ error: "رمز التحديث غير صالح أو منتهي الصلاحية" });
    return;
  }

  const token = generateToken();
  res.json(AdminRefreshResponse.parse({ token }));
});

export default router;
