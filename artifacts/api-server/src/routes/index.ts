import { Router } from "express";
import healthRouter from "./health";
import adminAuthRouter from "./admin-auth";
import categoriesRouter from "./categories";
import channelsRouter from "./channels";
import settingsRouter from "./settings";
import sourcesRouter from "./sources";

const router = Router();

router.use(healthRouter);
router.use(adminAuthRouter);
router.use(categoriesRouter);
router.use(channelsRouter);
router.use(settingsRouter);
router.use(sourcesRouter);

export default router;
