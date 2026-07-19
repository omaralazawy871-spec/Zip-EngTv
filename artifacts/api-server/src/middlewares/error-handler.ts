import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

const isProduction = process.env.NODE_ENV === "production";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  logger.error(
    { err, requestId: req.id, method: req.method, url: req.url },
    "Unhandled error",
  );

  res.status(500).json({
    error: isProduction ? "حدث خطأ داخلي في الخادم" : err.message,
    ...(isProduction ? {} : { stack: err.stack }),
    requestId: req.id,
  });
}
