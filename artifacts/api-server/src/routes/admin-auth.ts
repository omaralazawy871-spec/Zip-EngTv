import { Router, type IRouter } from "express";
import { generateToken } from "../middlewares/auth";
import { AdminLoginBody, AdminLoginResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.post("/admin/login", (req, res): void => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminPassword = process.env["ADMIN_PASSWORD"] || "admin123";
  if (parsed.data.password !== adminPassword) {
    res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    return;
  }

  const token = generateToken();
  res.json(AdminLoginResponse.parse({ token }));
});

export default router;
