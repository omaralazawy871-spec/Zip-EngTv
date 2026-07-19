import { pgTable, index, serial, text, integer, boolean, timestamp } from "drizzle-orm/pg-core";

export const categoriesTable = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  icon: text("icon"),
  sort_order: integer("sort_order").notNull().default(0),
  is_visible: boolean("is_visible").notNull().default(true),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  isVisibleIdx: index("idx_categories_is_visible").on(table.is_visible),
  nameIdx: index("idx_categories_name").on(table.name),
}));

export type Category = typeof categoriesTable.$inferSelect;
export type InsertCategory = typeof categoriesTable.$inferInsert;
