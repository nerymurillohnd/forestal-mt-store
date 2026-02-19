import { sql } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

// ─── product_groups (46 rows — one per ProductGroup) ────────────────────────
// Maps to Schema.org ProductGroup

export const productGroups = sqliteTable("product_groups", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  handler: text("handler").notNull().unique(), // URL slug: "raw-batana-oil"
  productGroupId: text("product_group_id").notNull().unique(), // "FMT-BO-RBO"
  name: text("name").notNull(),
  catalog: text("catalog").notNull(), // "Batana Oil" | "Traditional Herbs" | "Stingless Bee Honey"
  botanicalName: text("botanical_name"),
  availability: text("availability").default("InStock"),
  qualityBadge: text("quality_badge"),
  // Searchable columns — also indexed in product_groups_fts virtual table
  tags: text("tags", { mode: "json" }),
  commonNames: text("common_names", { mode: "json" }),
  shortDescription: text("short_description"),
  // Rich non-queryable data — stored as JSON TEXT blobs for frontend hydration
  contentJson: text("content_json", { mode: "json" }),
  mediaJson: text("media_json", { mode: "json" }),
  seoJson: text("seo_json", { mode: "json" }),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

// ─── product_variants (132 rows — one per SKU) ─────────────────────────────
// Maps to Schema.org Product (inside hasVariant)

export const productVariants = sqliteTable("product_variants", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  productGroupId: integer("product_group_id")
    .notNull()
    .references(() => productGroups.id, { onDelete: "cascade" }),
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

// ─── shipping_zones (9 rows — one per shipping region) ─────────────────────
// Maps to Schema.org OfferShippingDetails

export const shippingZones = sqliteTable("shipping_zones", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  zoneKey: text("zone_key").notNull().unique(), // "shipping-us", "shipping-ca"
  label: text("label").notNull(), // "United States", "Canada"
  countryCodes: text("country_codes", { mode: "json" }).notNull(),
  handlingMin: integer("handling_min").notNull().default(1),
  handlingMax: integer("handling_max").notNull().default(2),
  transitMin: integer("transit_min").notNull(),
  transitMax: integer("transit_max").notNull(),
  timeUnit: text("time_unit").notNull().default("d"),
});

// ─── return_policies (1 row) ────────────────────────────────────────────────
// Maps to Schema.org MerchantReturnPolicy

export const returnPolicies = sqliteTable("return_policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyKey: text("policy_key").notNull().unique(), // "return-policy"
  name: text("name").notNull(), // "30-Day Return Policy"
  returnDays: integer("return_days").notNull(),
  returnMethod: text("return_method").notNull(), // schema.org URL
  returnFees: text("return_fees").notNull(), // schema.org URL
  applicableCountry: text("applicable_country").notNull(), // "HN"
  merchantReturnLink: text("merchant_return_link").notNull(),
  description: text("description"),
});

// ─── Type exports ───────────────────────────────────────────────────────────

export type ProductGroup = typeof productGroups.$inferSelect;
export type NewProductGroup = typeof productGroups.$inferInsert;
export type ProductVariant = typeof productVariants.$inferSelect;
export type NewProductVariant = typeof productVariants.$inferInsert;
export type ShippingZone = typeof shippingZones.$inferSelect;
export type NewShippingZone = typeof shippingZones.$inferInsert;
export type ReturnPolicy = typeof returnPolicies.$inferSelect;
export type NewReturnPolicy = typeof returnPolicies.$inferInsert;
