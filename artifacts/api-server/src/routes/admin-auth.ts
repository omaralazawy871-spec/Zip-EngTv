import { Router, type IRouter } from "express";
import { generateToken } from "../middlewares/auth";
import { AdminLoginBody, AdminLoginResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function resolveAdminPassword(): string {
  const envPassword = process.env["ADMIN_PASSWORD"];
  if (envPassword) return envPassword;
  if (process.env["NODE_ENV"] === "production") {
    throw new Error(
      "ADMIN_PASSWORD environment variable is required but was not provided in production."
    );
  }
  return "admin123";
}

router.post("/admin/login", (req, res): void => {
  const parsed = AdminLoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const adminPassword = resolveAdminPassword();
  if (parsed.data.password !== adminPassword) {
    res.status(401).json({ error: "كلمة المرور غير صحيحة" });
    return;
  }

  const token = generateToken();
  res.json(AdminLoginResponse.parse({ token }));
});

export default router;
