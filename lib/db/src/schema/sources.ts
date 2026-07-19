import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const sourcesTable = pgTable("sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'xtream' | 'm3u'
  status: text("status").notNull().default("active"), // 'active' | 'inactive'
  // M3U fields
  url: text("url"),
  // Xtream Codes fields
  server_url: text("server_url"),
  username: text("username"),
  password: text("password"),
  // Stats
  last_sync_at: timestamp("last_sync_at"),
  last_successful_sync_at: timestamp("last_successful_sync_at"),
  channel_count: integer("channel_count").notNull().default(0),
  category_count: integer("category_count").notNull().default(0),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
  // Import filters (applied during sync)
  filter_language: text("filter_language").notNull().default("all"), // 'all' | 'arabic' | 'english'
  filter_countries: text("filter_countries"), // comma-separated ISO codes, null/empty = all
  filter_categories: text("filter_categories"), // comma-separated patterns, null/empty = all
  // Sync tracking
  sync_status: text("sync_status").notNull().default("idle"), // 'idle' | 'syncing' | 'failed'
  retry_count: integer("retry_count").notNull().default(0),
  error_message: text("error_message"),
  // Auto-sync scheduler
  sync_interval_hours: integer("sync_interval_hours").notNull().default(0), // 0 = manual only
  next_sync_at: timestamp("next_sync_at"),
});

export type Source = typeof sourcesTable.$inferSelect;
export type InsertSource = typeof sourcesTable.$inferInsert;
