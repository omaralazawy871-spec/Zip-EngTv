import { pgTable, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  sort_order: integer("sort_order").notNull().default(0),
  is_visible: boolean("is_visible").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;
