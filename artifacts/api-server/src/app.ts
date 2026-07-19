import express from "express";
import cors from "cors";
import helmet from "helmet";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { requestId } from "./middlewares/request-id";
import { errorHandler } from "./middlewares/error-handler";

const app = express();

const isProduction = process.env.NODE_ENV === "production";

// Security headers (replaces manual header set below)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false,
}));

// Request ID for tracing
app.use(requestId);

// Logging — redact sensitive fields in all environments
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

// CORS — restrict origin in production, allow all in development
app.use(cors(
  isProduction && process.env["CORS_ORIGIN"]
    ? { origin: process.env["CORS_ORIGIN"] }
    : undefined,
));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

app.use("/api", router);

// Global error handler — must be registered last
app.use(errorHandler);

export default app;
