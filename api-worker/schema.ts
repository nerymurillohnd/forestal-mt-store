import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── products (46 rows — one per ProductGroup) ───────────────────────────────

export const products = sqliteTable("products", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  handler: text("handler").notNull().unique(), // URL slug: "raw-batana-oil"
  productGroupId: text("product_group_id").notNull().unique(), // "FMT-BO-RBO"
  name: text("name").notNull(),
  catalog: text("catalog").notNull(), // "Batana Oil" | "Traditional Herbs" | "Stingless Bee Honey"
  botanicalName: text("botanical_name"),
  availability: text("availability").default("InStock"),
  qualityBadge: text("quality_badge"),
  // Searchable columns — also indexed in products_fts virtual table
  tags: text("tags"), // JSON array serialized as TEXT
  commonNames: text("common_names"), // JSON array serialized as TEXT
  shortDescription: text("short_description"),
  // Rich non-queryable data — stored as JSON TEXT blobs
  contentJson: text("content_json"), // full content object
  mediaJson: text("media_json"), // image URLs + alt text
  seoJson: text("seo_json"), // SEO title, description, OG
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── product_variants (132 rows — one per SKU) ───────────────────────────────

export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productId: integer("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  sku: text("sku").notNull().unique(),
  name: text("name").notNull(), // full variant display name
  size: text("size").notNull(), // "60 ml | 2 fl oz"
  weightKg: real("weight_kg"),
  packaging: text("packaging"),
  tareWeightG: real("tare_weight_g"),
  netWeightG: real("net_weight_g"),
  grossWeightG: real("gross_weight_g"),
  // Pricing — as columns (queried for cart/orders/checkout)
  price: real("price").notNull(),
  currency: text("currency").default("USD"),
  // Inventory — as columns (queried for stock checks)
  stockQty: integer("stock_qty").default(0),
  availability: text("availability").default("InStock"),
  minOrderQty: integer("min_order_qty").default(1),
  maxOrderQty: integer("max_order_qty").default(50),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── Type exports ─────────────────────────────────────────────────────────────

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
