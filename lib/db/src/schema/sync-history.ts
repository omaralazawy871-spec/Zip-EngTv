import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";

export const syncHistoryTable = pgTable("sync_history", {
  id: serial("id").primaryKey(),
  source_id: integer("source_id").notNull(),
  status: text("status").notNull().default("running"), // 'running' | 'success' | 'failed'
  channels_imported: integer("channels_imported").notNull().default(0),
  categories_imported: integer("categories_imported").notNull().default(0),
  error_message: text("error_message"),
  started_at: timestamp("started_at").notNull().defaultNow(),
  completed_at: timestamp("completed_at"),
});

export type SyncHistory = typeof syncHistoryTable.$inferSelect;
export type InsertSyncHistory = typeof syncHistoryTable.$inferInsert;
