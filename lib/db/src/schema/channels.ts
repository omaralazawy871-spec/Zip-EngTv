import { pgTable, index, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const channelsTable = pgTable("channels", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  stream_url: text("stream_url").notNull(),
  logo_url: text("logo_url"),
  category_id: integer("category_id"),
  source_id: integer("source_id"),
  external_id: text("external_id"),
  is_active: boolean("is_active").notNull().default(true),
  sort_order: integer("sort_order").notNull().default(0),
  language: text("language").default("unknown"), // 'ar', 'en', 'unknown'
  country: text("country"), // ISO country code
  created_at: timestamp("created_at").notNull().defaultNow(),
  // Health check
  last_checked_at: timestamp("last_checked_at"),
  is_healthy: boolean("is_healthy"), // null = unchecked, true = working, false = broken
  health_error: text("health_error"),
}, (table) => ({
  categoryIdIdx: index("idx_channels_category_id").on(table.category_id),
  sourceIdIdx: index("idx_channels_source_id").on(table.source_id),
  isActiveIdx: index("idx_channels_is_active").on(table.is_active),
  languageIdx: index("idx_channels_language").on(table.language),
  externalIdIdx: index("idx_channels_external_id").on(table.external_id),
  nameIdx: index("idx_channels_name").on(table.name),
}));

export type Channel = typeof channelsTable.$inferSelect;
export type InsertChannel = typeof channelsTable.$inferInsert;
