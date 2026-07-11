import { pgTable, text } from "drizzle-orm/pg-core";

export const settingsTable = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export type Setting = typeof settingsTable.$inferSelect;
export type InsertSetting = typeof settingsTable.$inferInsert;
