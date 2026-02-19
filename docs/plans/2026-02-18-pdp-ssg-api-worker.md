# PDPs SSG + api-worker Foundation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build 46 static PDPs + Shop page with full JSON-LD Product schemas and SEO, plus the api-worker scaffold with Drizzle schema and D1 migrations.

**Architecture:** Astro SSG with `getStaticPaths()` reads the 6 JSON files in `src/data/jsonld/products/` at build time to generate all 46 PDPs as static HTML — no D1 access during build. D1 is seeded from the same JSON files and used exclusively by the api-worker at runtime (cart, search, orders). The api-worker is a self-contained Hono + Drizzle Cloudflare Worker with its own `package.json` and `wrangler.toml`. Astro pages import the Drizzle schema types via relative path for type safety.

**Tech Stack:** Astro 5.7 (SSG), `getStaticPaths()`, `@astrojs/sitemap` (auto), Preact islands, Hono 4, Drizzle ORM + drizzle-kit, Cloudflare D1 (FMT-73979325), TypeScript throughout.

**Data sources at build time:**

- `src/data/jsonld/products/products.json` — 46 product groups, handlers, variants
- `src/data/jsonld/products/seo.json` — title, description, OG image per product
- `src/data/jsonld/products/content.json` — description, tags, traditional uses, category
- `src/data/jsonld/products/media.json` — productGroup image, OG image, variant images
- `src/data/jsonld/products/pricing.json` — price per SKU (for JSON-LD AggregateOffer)
- `src/data/jsonld/products/inventory.json` — stock, availability per SKU

---

## Phase 1: api-worker Scaffold

### Task 1: Create api-worker directory structure

**Files:**

- Create: `api-worker/package.json`
- Create: `api-worker/wrangler.toml`
- Create: `api-worker/tsconfig.json`
- Create: `api-worker/src/index.ts`

**Step 1: Create `api-worker/package.json`**

```json
{
  "name": "fmt-api-worker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "deploy:prod": "wrangler deploy --env production",
    "cf-typegen": "wrangler types"
  },
  "dependencies": {
    "drizzle-orm": "^0.40.0",
    "hono": "^4.7.0"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20260218.0",
    "typescript": "^5.7.0",
    "wrangler": "^4.50.0"
  }
}
```

**Step 2: Create `api-worker/wrangler.toml`**

```toml
name = "fmt-ecommerce-api"
main = "src/index.ts"
compatibility_date = "2025-01-01"
compatibility_flags = ["nodejs_compat"]

[[d1_databases]]
binding = "DB"
database_name = "fmt-products-database"
database_id = "73979325-5642-4263-8146-a13f20b36ea6"

[[r2_buckets]]
binding = "R2"
bucket_name = "assets"

[vars]
ENVIRONMENT = "development"

[env.production]
[env.production.vars]
ENVIRONMENT = "production"
```

**Step 3: Create `api-worker/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "skipLibCheck": true,
    "noEmit": true
  },
  "include": ["src", "schema.ts"]
}
```

**Step 4: Create `api-worker/src/index.ts` (Hono skeleton)**

```typescript
import { Hono } from "hono";
import { cors } from "hono/cors";

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: ["https://forestal-mt.com", "http://localhost:4321"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", env: c.env.ENVIRONMENT });
});

// TODO: mount routers — /api/products, /api/search, /api/cart, /api/orders

export default app;
```

**Step 5: Install api-worker dependencies**

```bash
cd api-worker && npm install
```

Expected: `node_modules/` created with hono, drizzle-orm, wrangler.

**Step 6: Commit**

```bash
git add api-worker/
git commit -m "feat: scaffold api-worker with Hono + wrangler.toml pointing to D1"
```

---

## Phase 2: Drizzle Schema + Root Config

### Task 2: Define Drizzle schema and install drizzle-kit

**Files:**

- Create: `api-worker/schema.ts`
- Create: `drizzle.config.ts` (project root)
- Modify: `package.json` (root — add drizzle-kit + drizzle-orm devDeps)

**Step 1: Install at project root**

```bash
pnpm add drizzle-orm
pnpm add -D drizzle-kit
```

Expected: both packages in root `package.json`.

**Step 2: Create `api-worker/schema.ts`**

```typescript
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
```

**Step 3: Create `drizzle.config.ts` at project root**

```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./api-worker/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "73979325-5642-4263-8146-a13f20b36ea6",
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
```

**Step 4: Add env vars to `.env` for local drizzle-kit**

```bash
# .env (already gitignored)
CLOUDFLARE_ACCOUNT_ID=fd7d52b900e24bff797ebe2e34dbd638
CLOUDFLARE_API_TOKEN=2Jt_lZopcfTs6aFSAc9nFENmvWjDkcIN4w_aeVjW
```

**Step 5: Commit**

```bash
git add api-worker/schema.ts drizzle.config.ts
git commit -m "feat: define Drizzle schema — products + product_variants"
```

---

## Phase 3: D1 Migrations

### Task 3: Generate and apply schema migration

**Files:**

- Auto-generated: `drizzle/migrations/0000_products_schema.sql`
- Create manually: `drizzle/migrations/0001_products_fts.sql`

**Step 1: Generate migration from schema**

```bash
pnpm exec drizzle-kit generate
```

Expected: `drizzle/migrations/0000_products_schema.sql` created with `CREATE TABLE products` and `CREATE TABLE product_variants` statements.

**Step 2: Verify generated SQL looks correct**

Open `drizzle/migrations/0000_products_schema.sql` and confirm:

- `CREATE TABLE products` has `handler TEXT NOT NULL UNIQUE`
- `CREATE TABLE product_variants` has FK to products + `sku TEXT NOT NULL UNIQUE`

**Step 3: Create `drizzle/migrations/0001_products_fts.sql` manually**

Drizzle-kit does not support FTS5 virtual tables. Create this file by hand:

```sql
-- FTS5 virtual table for product search autocomplete
-- Indexes searchable text fields from the products table
CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
  name,
  catalog,
  botanical_name,
  tags,
  common_names,
  short_description,
  quality_badge,
  content='products',
  content_rowid='id'
);

-- Sync triggers: keep products_fts in sync with products table

CREATE TRIGGER IF NOT EXISTS products_ai AFTER INSERT ON products BEGIN
  INSERT INTO products_fts(rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES (new.id, new.name, new.catalog, new.botanical_name, new.tags, new.common_names, new.short_description, new.quality_badge);
END;

CREATE TRIGGER IF NOT EXISTS products_ad AFTER DELETE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES ('delete', old.id, old.name, old.catalog, old.botanical_name, old.tags, old.common_names, old.short_description, old.quality_badge);
END;

CREATE TRIGGER IF NOT EXISTS products_au AFTER UPDATE ON products BEGIN
  INSERT INTO products_fts(products_fts, rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES ('delete', old.id, old.name, old.catalog, old.botanical_name, old.tags, old.common_names, old.short_description, old.quality_badge);
  INSERT INTO products_fts(rowid, name, catalog, botanical_name, tags, common_names, short_description, quality_badge)
  VALUES (new.id, new.name, new.catalog, new.botanical_name, new.tags, new.common_names, new.short_description, new.quality_badge);
END;
```

**Step 4: Apply migration 0000 to remote D1**

```bash
node_modules/.pnpm/node_modules/.bin/wrangler d1 execute fmt-products-database \
  --remote \
  --file=drizzle/migrations/0000_products_schema.sql
```

Expected: `🚣 Executed N commands` — no errors.

**Step 5: Apply migration 0001 (FTS5) to remote D1**

```bash
node_modules/.pnpm/node_modules/.bin/wrangler d1 execute fmt-products-database \
  --remote \
  --file=drizzle/migrations/0001_products_fts.sql
```

Expected: `🚣 Executed 4 commands` (CREATE VIRTUAL TABLE + 3 triggers).

**Step 6: Verify tables exist**

```bash
node_modules/.pnpm/node_modules/.bin/wrangler d1 execute fmt-products-database \
  --remote \
  --command="SELECT name FROM sqlite_master WHERE type IN ('table','trigger') ORDER BY name;"
```

Expected output includes: `products`, `product_variants`, `products_fts`, `products_ai`, `products_ad`, `products_au` plus existing tables.

**Step 7: Commit**

```bash
git add drizzle/
git commit -m "feat: D1 migrations — products, product_variants tables + FTS5 search index"
```

---

## Phase 4: Seed D1 from JSON Files

### Task 4: Write and run seed script

**Files:**

- Create: `scripts/seed-products.ts`

**Step 1: Create `scripts/seed-products.ts`**

```typescript
/**
 * Seed script: reads all 6 product JSON files and generates SQL INSERT statements
 * for products and product_variants tables.
 *
 * Usage: npx tsx scripts/seed-products.ts | wrangler d1 execute fmt-products-database --remote --file=-
 * Or:    npx tsx scripts/seed-products.ts > /tmp/seed.sql
 *        wrangler d1 execute fmt-products-database --remote --file=/tmp/seed.sql
 */

import { readFileSync } from "fs";
import { join } from "path";

const DATA_DIR = join(process.cwd(), "src/data/jsonld/products");

const productsData = JSON.parse(readFileSync(join(DATA_DIR, "products.json"), "utf-8"));
const contentData = JSON.parse(readFileSync(join(DATA_DIR, "content.json"), "utf-8"));
const mediaData = JSON.parse(readFileSync(join(DATA_DIR, "media.json"), "utf-8"));
const seoData = JSON.parse(readFileSync(join(DATA_DIR, "seo.json"), "utf-8"));
const pricingData = JSON.parse(readFileSync(join(DATA_DIR, "pricing.json"), "utf-8"));
const inventoryData = JSON.parse(readFileSync(join(DATA_DIR, "inventory.json"), "utf-8"));

// Build lookup maps by handler
const contentMap = Object.fromEntries(contentData.products.map((p: any) => [p.handler, p]));
const mediaMap = Object.fromEntries(mediaData.products.map((p: any) => [p.handler, p]));
const seoMap = Object.fromEntries(seoData.products.map((p: any) => [p.handler, p]));
const pricingMap = Object.fromEntries(
  pricingData.products.map((p: any) => [p.ProductGroup.handler, p.ProductGroup]),
);
const inventoryMap = Object.fromEntries(inventoryData.products.map((p: any) => [p.handler, p]));

function esc(value: string | null | undefined): string {
  if (value === null || value === undefined) return "NULL";
  return `'${String(value).replace(/'/g, "''")}'`;
}

const lines: string[] = ["BEGIN TRANSACTION;", ""];

for (const product of productsData.products) {
  const handler = product.handler;
  const content = contentMap[handler];
  const media = mediaMap[handler];
  const seo = seoMap[handler];

  // Serialize JSON blobs (strip fields already stored as columns)
  const contentBlob = JSON.stringify(content);
  const mediaBlob = JSON.stringify(media);
  const seoBlob = JSON.stringify(seo);

  const tags = JSON.stringify(content?.tags ?? []);
  const commonNames = JSON.stringify(content?.commonNames ?? content?.common_names ?? []);

  lines.push(
    `INSERT OR REPLACE INTO products ` +
      `(handler, product_group_id, name, catalog, botanical_name, availability, quality_badge, ` +
      `tags, common_names, short_description, content_json, media_json, seo_json) VALUES (` +
      `${esc(handler)}, ` +
      `${esc(product.productGroupId)}, ` +
      `${esc(product.name)}, ` +
      `${esc(product.catalog)}, ` +
      `${esc(product.botanical_name)}, ` +
      `'InStock', ` +
      `${esc(content?.qualityBadge ?? content?.quality_badge)}, ` +
      `${esc(tags)}, ` +
      `${esc(commonNames)}, ` +
      `${esc(content?.shortDescription ?? content?.short_description)}, ` +
      `${esc(contentBlob)}, ` +
      `${esc(mediaBlob)}, ` +
      `${esc(seoBlob)}` +
      `);`,
  );
}

lines.push("");
lines.push("-- product_variants (132 rows)");
lines.push("");

for (const product of productsData.products) {
  const handler = product.handler;
  const pricing = pricingMap[handler];
  const inventory = inventoryMap[handler];

  if (!pricing) continue;

  const invVariantMap = Object.fromEntries((inventory?.variants ?? []).map((v: any) => [v.sku, v]));

  for (const variant of pricing.variants) {
    const inv = invVariantMap[variant.sku] ?? {};

    lines.push(
      `INSERT OR REPLACE INTO product_variants ` +
        `(product_id, sku, name, size, weight_kg, packaging, tare_weight_g, net_weight_g, gross_weight_g, ` +
        `price, currency, stock_qty, availability, min_order_qty, max_order_qty) ` +
        `SELECT p.id, ` +
        `${esc(variant.sku)}, ` +
        `${esc(variant.skuName)}, ` +
        `${esc(inv.size ?? "")}, ` +
        `${inv.weight_kg ?? "NULL"}, ` +
        `${esc(inv.packaging)}, ` +
        `${inv.tareWeight_g ?? "NULL"}, ` +
        `${inv.netWeight_g ?? "NULL"}, ` +
        `${inv.grossWeight_g ?? "NULL"}, ` +
        `${variant.price}, ` +
        `'USD', ` +
        `${inv.stockQty ?? 0}, ` +
        `${esc(inv.availability ?? "InStock")}, ` +
        `${inv.minOrderQty ?? 1}, ` +
        `${inv.maxOrderQty ?? 50} ` +
        `FROM products p WHERE p.handler = ${esc(handler)};`,
    );
  }
}

lines.push("");
lines.push("-- Rebuild FTS index after seeding");
lines.push("INSERT INTO products_fts(products_fts) VALUES ('rebuild');");
lines.push("");
lines.push("COMMIT;");

process.stdout.write(lines.join("\n") + "\n");
```

**Step 2: Add `tsx` as devDependency (needed to run the TS script)**

```bash
pnpm add -D tsx
```

**Step 3: Run seed script and save output to a temp file**

```bash
npx tsx scripts/seed-products.ts > /tmp/fmt-seed.sql
wc -l /tmp/fmt-seed.sql
```

Expected: ~250-300 lines of SQL (46 product INSERTs + 132 variant INSERTs).

**Step 4: Review first 30 lines of seed file**

```bash
head -30 /tmp/fmt-seed.sql
```

Verify INSERT statements look correct (no obvious NULL where data should exist).

**Step 5: Apply seed to remote D1**

```bash
node_modules/.pnpm/node_modules/.bin/wrangler d1 execute fmt-products-database \
  --remote \
  --file=/tmp/fmt-seed.sql
```

Expected: no errors, `🚣 Executed N commands`.

**Step 6: Verify seed counts**

```bash
node_modules/.pnpm/node_modules/.bin/wrangler d1 execute fmt-products-database \
  --remote \
  --command="SELECT COUNT(*) as products FROM products; SELECT COUNT(*) as variants FROM product_variants; SELECT COUNT(*) as fts FROM products_fts;"
```

Expected: `products: 46`, `variants: 132`, `fts: 46`.

**Step 7: Test FTS5 search**

```bash
node_modules/.pnpm/node_modules/.bin/wrangler d1 execute fmt-products-database \
  --remote \
  --command="SELECT name, catalog FROM products_fts WHERE products_fts MATCH 'bat*' LIMIT 5;"
```

Expected: returns Batana Oil products.

**Step 8: Commit**

```bash
git add scripts/seed-products.ts
git commit -m "feat: seed script to populate D1 products + variants from JSON source files"
```

---

## Phase 5: Astro SSG Product Pages

### Task 5: Create JSON-LD Product schema builder

**Files:**

- Create: `src/lib/product-jsonld.ts`

**Step 1: Create `src/lib/product-jsonld.ts`**

```typescript
/**
 * JSON-LD schema builder for Product Detail Pages (PDPs).
 * Called from getStaticPaths() props — all data comes from JSON files at build time.
 */

const SITE_URL = "https://forestal-mt.com";

const CATALOG_URLS: Record<string, string> = {
  "Batana Oil": `${SITE_URL}/batana-oil/`,
  "Traditional Herbs": `${SITE_URL}/traditional-herbs/`,
  "Stingless Bee Honey": `${SITE_URL}/stingless-bee-honey/`,
};

export interface ProductJsonLdData {
  product: {
    handler: string;
    name: string;
    catalog: string;
    botanical_name?: string;
    price_range_usd: { low: string; high: string };
    variant_count: number;
  };
  content: {
    shortDescription?: string;
    short_description?: string;
    description?: string;
    category?: string;
    origin?: string;
    storage?: string;
    shelfLife?: string;
    shelf_life?: string;
    ingredients?: string;
    tags?: string[];
    traditionalUses?: string[];
    traditional_uses?: string[];
    disclaimer?: string;
  };
  media: {
    image: {
      url: string;
      alt: string;
      caption?: string;
      width: number;
      height: number;
    };
    ogImage: {
      url: string;
      alt: string;
      width: number;
      height: number;
    };
  };
  seo: {
    seoTitle: string;
    canonicalUrl?: string;
  };
}

/** Build the Product schema node for a PDP */
export function buildProductSchema(data: ProductJsonLdData): Record<string, unknown> {
  const { product, content, media } = data;
  const canonicalUrl = `${SITE_URL}/products/${product.handler}/`;
  const shortDesc = content.shortDescription ?? content.short_description ?? "";
  const uses = content.traditionalUses ?? content.traditional_uses ?? [];

  return {
    "@type": "Product",
    "@id": `${canonicalUrl}#product`,
    name: product.name,
    description: shortDesc,
    brand: { "@id": `${SITE_URL}/#brand` },
    manufacturer: { "@id": `${SITE_URL}/#organization` },
    image: {
      "@type": "ImageObject",
      "@id": `${canonicalUrl}#product-image`,
      url: media.image.url,
      name: media.image.alt,
      caption: media.image.caption,
      width: media.image.width,
      height: media.image.height,
      encodingFormat: "image/png",
    },
    offers: {
      "@type": "AggregateOffer",
      "@id": `${canonicalUrl}#offers`,
      priceCurrency: "USD",
      lowPrice: product.price_range_usd.low,
      highPrice: product.price_range_usd.high,
      offerCount: product.variant_count,
      availability: "https://schema.org/InStock",
      url: canonicalUrl,
      seller: { "@id": `${SITE_URL}/#organization` },
    },
    additionalType: content.category,
    countryOfOrigin: { "@type": "Country", name: "Honduras" },
    ...(product.botanical_name && {
      additionalProperty: [
        {
          "@type": "PropertyValue",
          name: "Botanical Name",
          value: product.botanical_name,
        },
        ...uses.slice(0, 4).map((use, i) => ({
          "@type": "PropertyValue",
          name: `Traditional Use ${i + 1}`,
          value: use,
        })),
      ],
    }),
  };
}

/** Build 3-level BreadcrumbList for a PDP */
export function buildProductBreadcrumb(
  productName: string,
  catalog: string,
  handler: string,
): Record<string, unknown> {
  const catalogUrl = CATALOG_URLS[catalog] ?? `${SITE_URL}/`;
  const productUrl = `${SITE_URL}/products/${handler}/`;

  return {
    "@type": "BreadcrumbList",
    "@id": `${productUrl}#breadcrumb`,
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: `${SITE_URL}/`,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: catalog,
        item: catalogUrl,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: productName,
        item: productUrl,
      },
    ],
  };
}

/** Build WebPage node for a PDP */
export function buildProductWebPage(data: ProductJsonLdData): Record<string, unknown> {
  const { product, seo, media } = data;
  const canonicalUrl = `${SITE_URL}/products/${product.handler}/`;

  return {
    "@type": "WebPage",
    "@id": `${canonicalUrl}#webpage`,
    url: canonicalUrl,
    name: seo.seoTitle,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${canonicalUrl}#product` },
    primaryImageOfPage: { "@id": `${canonicalUrl}#product-image` },
    breadcrumb: { "@id": `${canonicalUrl}#breadcrumb` },
    inLanguage: "en-US",
    potentialAction: {
      "@type": "ReadAction",
      target: [canonicalUrl],
    },
  };
}

/** Assemble full @graph for a PDP */
export function buildProductPageGraph(data: ProductJsonLdData): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "Organization", "@id": `${SITE_URL}/#organization` },
      { "@type": "Brand", "@id": `${SITE_URL}/#brand` },
      { "@type": "WebSite", "@id": `${SITE_URL}/#website` },
      buildProductWebPage(data),
      buildProductBreadcrumb(data.product.name, data.product.catalog, data.product.handler),
      buildProductSchema(data),
    ],
  };
}
```

**Step 2: Commit**

```bash
git add src/lib/product-jsonld.ts
git commit -m "feat: JSON-LD Product schema builder for PDPs — Product, BreadcrumbList, WebPage nodes"
```

---

### Task 6: Create `src/pages/products/[handler].astro`

**Files:**

- Create: `src/pages/products/[handler].astro`

**Step 1: Create the PDP page with `getStaticPaths()`**

```astro
---
import type { GetStaticPaths, InferGetStaticPropsType } from "astro";
import BaseLayout from "../../layouts/BaseLayout.astro";
import Breadcrumb from "../../components/Breadcrumb.astro";
import { buildProductPageGraph } from "../../lib/product-jsonld";

// JSON imports — available at build time (not D1)
import productsData from "../../data/jsonld/products/products.json";
import seoData from "../../data/jsonld/products/seo.json";
import contentData from "../../data/jsonld/products/content.json";
import mediaData from "../../data/jsonld/products/media.json";
import pricingData from "../../data/jsonld/products/pricing.json";
import inventoryData from "../../data/jsonld/products/inventory.json";

export const getStaticPaths = (async () => {
  // Build O(1) lookup maps by handler
  const seoMap = Object.fromEntries(seoData.products.map((p) => [p.handler, p]));
  const contentMap = Object.fromEntries(contentData.products.map((p) => [p.handler, p]));
  const mediaMap = Object.fromEntries(mediaData.products.map((p) => [p.handler, p]));
  const pricingMap = Object.fromEntries(
    pricingData.products.map((p) => [p.ProductGroup.handler, p.ProductGroup]),
  );
  const inventoryMap = Object.fromEntries(inventoryData.products.map((p) => [p.handler, p]));

  return productsData.products
    .filter((p) => seoMap[p.handler]?.published !== false)
    .map((product) => ({
      params: { handler: product.handler },
      props: {
        product,
        seo: seoMap[product.handler],
        content: contentMap[product.handler],
        media: mediaMap[product.handler],
        pricing: pricingMap[product.handler],
        inventory: inventoryMap[product.handler],
      },
    }));
}) satisfies GetStaticPaths;

type Props = InferGetStaticPropsType<typeof getStaticPaths>;
const { product, seo, content, media, pricing, inventory } = Astro.props;

const canonicalUrl = `https://forestal-mt.com/products/${product.handler}/`;
const shortDesc = content?.shortDescription ?? content?.short_description ?? "";

// Build JSON-LD @graph
const jsonLd = buildProductPageGraph({ product, seo, content, media, pricing });

// Catalog parent for breadcrumb
const CATALOG_PARENTS: Record<string, { name: string; href: string }> = {
  "Batana Oil": { name: "Batana Oil", href: "/batana-oil/" },
  "Traditional Herbs": { name: "Traditional Herbs", href: "/traditional-herbs/" },
  "Stingless Bee Honey": { name: "Stingless Bee Honey", href: "/stingless-bee-honey/" },
};
const parent = CATALOG_PARENTS[product.catalog];
---

<BaseLayout
  title={seo?.seoTitle ?? product.name}
  description={seo?.seoDescription ?? shortDesc}
  canonicalUrl={canonicalUrl}
  og={{
    title: seo?.seoTitle ?? product.name,
    description: seo?.seoDescription ?? shortDesc,
    image: {
      url: seo?.ogImageUrl ?? media?.image?.url ?? "",
      alt: seo?.ogImageAlt ?? media?.image?.alt ?? product.name,
      width: seo?.ogImageWidth ?? 1200,
      height: seo?.ogImageHeight ?? 630,
    },
  }}
  twitter={{ card: seo?.twitterCard ?? "summary_large_image" }}
>
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} slot="head" />

  <Breadcrumb pageName={product.name} parent={parent} />

  <main class="surface-warm">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <!-- Product header -->
      <div class="grid lg:grid-cols-2 gap-12">
        <!-- Product image -->
        <div>
          <img
            src={media?.image?.url}
            alt={media?.image?.alt}
            width={media?.image?.width ?? 1200}
            height={media?.image?.height ?? 1200}
            loading="eager"
            decoding="async"
            class="w-full rounded-lg"
          />
        </div>

        <!-- Product info -->
        <div class="flex flex-col gap-6">
          <div>
            <p
              class="text-[color:var(--color-gold-dark)] uppercase tracking-widest text-sm font-[family-name:var(--font-heading)]"
            >
              {product.catalog}
            </p>
            <h1
              class="text-4xl font-[family-name:var(--font-display)] text-[color:var(--color-charcoal)] mt-2"
            >
              {product.name}
            </h1>
            {
              product.botanical_name && (
                <p class="text-[color:var(--color-graphite)] italic mt-1 font-[family-name:var(--font-body)]">
                  {product.botanical_name}
                </p>
              )
            }
          </div>

          {
            content?.qualityBadge && (
              <span class="inline-block self-start px-3 py-1 bg-[color:var(--color-gold)] text-[color:var(--color-charcoal)] text-xs font-[family-name:var(--font-heading)] uppercase tracking-wider rounded">
                {content.qualityBadge}
              </span>
            )
          }

          <p
            class="text-[color:var(--color-graphite)] font-[family-name:var(--font-body)] leading-relaxed"
          >
            {shortDesc}
          </p>

          <!-- Price range -->
          <div
            class="text-2xl font-[family-name:var(--font-heading)] text-[color:var(--color-charcoal)]"
          >
            ${product.price_range_usd.low}
            {
              product.price_range_usd.low !== product.price_range_usd.high && (
                <span> – ${product.price_range_usd.high}</span>
              )
            }
          </div>

          <!-- TODO: Add to cart island (api-worker integration) -->
          <p class="text-sm text-[color:var(--color-graphite)]">
            {product.variant_count} size{product.variant_count > 1 ? "s" : ""} available
          </p>
        </div>
      </div>
    </div>
  </main>
</BaseLayout>
```

**Step 2: Run build to verify all 46 PDPs generate**

```bash
pnpm build 2>&1 | grep -E "(products/|error|warning)" | head -30
```

Expected: lines like `▶ /products/raw-batana-oil/` for each of 46 handlers. No errors.

**Step 3: Check generated output**

```bash
ls dist/products/ | wc -l
```

Expected: 46 directories.

**Step 4: Verify JSON-LD in a generated PDP**

```bash
grep -o '"@type":"Product"' dist/products/raw-batana-oil/index.html | head -3
```

Expected: `"@type":"Product"` appears in the HTML.

**Step 5: Commit**

```bash
git add src/pages/products/ src/lib/product-jsonld.ts
git commit -m "feat: 46 SSG PDPs with getStaticPaths() + JSON-LD Product schema"
```

---

### Task 7: Create Shop page `src/pages/products/index.astro`

**Files:**

- Create: `src/pages/products/index.astro`

**Step 1: Create Shop listing page**

```astro
---
import BaseLayout from "../../layouts/BaseLayout.astro";
import Breadcrumb from "../../components/Breadcrumb.astro";
import productsData from "../../data/jsonld/products/products.json";
import mediaData from "../../data/jsonld/products/media.json";
import seoData from "../../data/jsonld/products/seo.json";

const mediaMap = Object.fromEntries(mediaData.products.map((p) => [p.handler, p]));
const seoMap = Object.fromEntries(seoData.products.map((p) => [p.handler, p]));

const published = productsData.products.filter((p) => seoMap[p.handler]?.published !== false);

// Group by catalog
const CATALOG_ORDER = ["Batana Oil", "Stingless Bee Honey", "Traditional Herbs"];
const byCatalog = CATALOG_ORDER.map((catalog) => ({
  catalog,
  products: published.filter((p) => p.catalog === catalog),
}));

const canonicalUrl = "https://forestal-mt.com/products/";
---

<BaseLayout
  title="Shop All Products | Forestal MT"
  description="Browse our full catalog: Raw Batana Oil from La Mosquitia, Jimerito Stingless Bee Honey from Olancho, and 41 wildcrafted Traditional Herbs from Honduras."
  canonicalUrl={canonicalUrl}
  og={{
    title: "Shop All Products | Forestal MT",
    description:
      "46 premium ethnobotanical products sourced directly from indigenous communities in Honduras.",
    image: {
      url: "https://cdn.forestal-mt.com/pages/home/og.jpg",
      alt: "Forestal MT product collection",
      width: 1200,
      height: 630,
    },
  }}
  twitter={{ card: "summary_large_image" }}
>
  <Breadcrumb pageName="Shop All Products" />

  <main class="surface-warm">
    <div class="max-w-7xl mx-auto px-4 py-12">
      <h1
        class="text-5xl font-[family-name:var(--font-display)] text-[color:var(--color-charcoal)] mb-4"
      >
        All Products
      </h1>
      <p class="text-[color:var(--color-graphite)] font-[family-name:var(--font-body)] mb-12">
        {published.length} products — sourced directly from origin communities in Honduras
      </p>

      {
        byCatalog.map(
          ({ catalog, products }) =>
            products.length > 0 && (
              <section class="mb-16">
                <h2 class="text-2xl font-[family-name:var(--font-heading)] text-[color:var(--color-charcoal)] mb-6 gold-rule-left">
                  {catalog}
                </h2>
                <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 stagger-children">
                  {products.map((product) => {
                    const media = mediaMap[product.handler];
                    return (
                      <a
                        href={`/products/${product.handler}/`}
                        class="card-hover block p-4 rounded-lg"
                      >
                        <img
                          src={media?.image?.url}
                          alt={media?.image?.alt ?? product.name}
                          width={400}
                          height={400}
                          loading="lazy"
                          decoding="async"
                          class="w-full aspect-square object-cover rounded mb-3"
                        />
                        <h3 class="font-[family-name:var(--font-heading)] text-sm text-[color:var(--color-charcoal)]">
                          {product.name}
                        </h3>
                        <p class="text-[color:var(--color-gold-dark)] text-sm mt-1">
                          From ${product.price_range_usd.low}
                        </p>
                      </a>
                    );
                  })}
                </div>
              </section>
            ),
        )
      }
    </div>
  </main>
</BaseLayout>
```

**Step 2: Build and verify**

```bash
pnpm build 2>&1 | grep -E "(products|error)" | head -10
```

Expected: `/products/` page generated, no errors.

**Step 3: Commit**

```bash
git add src/pages/products/index.astro
git commit -m "feat: Shop page at /products/ — catalog listing grouped by category"
```

---

## Phase 6: Build Verification + Sitemap

### Task 8: Full build verification

**Step 1: Run full production build**

```bash
pnpm build
```

Expected: build completes with no TypeScript errors, no ESLint errors, no Astro errors.

**Step 2: Count generated product pages**

```bash
ls dist/products/ | wc -l
```

Expected: 47 entries (46 product dirs + `index.html` for Shop page).

**Step 3: Verify sitemap includes product URLs**

```bash
grep "/products/" dist/sitemap-0.xml | wc -l
```

Expected: 47 lines (46 PDPs + Shop page).

**Step 4: Check a PDP for critical SEO elements**

```bash
grep -c "application/ld+json" dist/products/raw-batana-oil/index.html
grep '"@type":"Product"' dist/products/raw-batana-oil/index.html | wc -c
grep '<meta name="description"' dist/products/raw-batana-oil/index.html
```

Expected:

- `1` (one JSON-LD script block)
- `>0` characters (Product schema present)
- `<meta name="description" content="Authentic batana oil...` visible

**Step 5: Verify canonical URL is correct**

```bash
grep 'canonical' dist/products/raw-batana-oil/index.html
```

Expected: `<link rel="canonical" href="https://forestal-mt.com/products/raw-batana-oil/">`

**Step 6: Run lint + type check**

```bash
pnpm lint && pnpm check
```

Expected: no errors.

**Step 7: Final commit**

```bash
git add -A
git commit -m "feat: 46 SSG PDPs + Shop page — full build verified, sitemap auto-generated"
```

---

## Appendix: Wrangler binary alias

Throughout this plan, the wrangler binary path is:

```
node_modules/.pnpm/node_modules/.bin/wrangler
```

To avoid typing this, add to `package.json` scripts:

```json
"wrangler": "node_modules/.pnpm/node_modules/.bin/wrangler"
```

Then use: `pnpm wrangler d1 execute ...`

---

## Key architectural decisions documented

| Decision                                               | Rationale                                                       |
| ------------------------------------------------------ | --------------------------------------------------------------- |
| `getStaticPaths()` reads JSON files, not D1            | D1 bindings don't exist at CI build time — only at CF runtime   |
| Drizzle schema in `api-worker/schema.ts`               | Single source of truth, importable by Astro via relative path   |
| FTS5 in manual migration (not drizzle-kit)             | drizzle-kit cannot generate virtual tables                      |
| Searchable fields as columns in `products`             | Required for FTS5 `content=` mode (external content table)      |
| Rich data as JSON blobs (`content_json`, etc.)         | Never queried individually — only fetched whole for page render |
| Pricing + inventory as columns in `product_variants`   | Queried by cart, stock checks, checkout flow                    |
| `@astrojs/sitemap` auto-detects getStaticPaths() pages | All 46 PDPs + Shop auto-included without manual configuration   |
