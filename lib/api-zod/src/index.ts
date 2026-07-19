export * from "./generated/api";
export * from "./generated/types";
export * from './generated/api';
export * from './generated/types';

// ── Manual types (not covered by generated OpenAPI spec) ──────────────────
import { z } from "zod";

export const AdminRefreshBody = z.object({
  refresh_token: z.string(),
});
export type AdminRefreshBody = z.infer<typeof AdminRefreshBody>;

export const AdminRefreshResponse = z.object({
  token: z.string(),
});
export type AdminRefreshResponse = z.infer<typeof AdminRefreshResponse>;
