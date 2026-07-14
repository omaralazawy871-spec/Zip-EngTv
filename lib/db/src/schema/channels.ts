import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

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
});

export type Channel = typeof channelsTable.$inferSelect;
export type InsertChannel = typeof channelsTable.$inferInsert;
