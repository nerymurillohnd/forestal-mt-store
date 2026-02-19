/**
 * Seed script for D1 database.
 *
 * Reads the 6 product JSON files + OfferShippingDetails + Organization,
 * builds SQL INSERT statements, writes to a temp .sql file,
 * then executes via wrangler d1 execute --remote.
 *
 * Usage: npx tsx scripts/seed-products.ts
 */

import { readFileSync, writeFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const ROOT = resolve(import.meta.dirname, "..");
const DATA = resolve(ROOT, "src/data/jsonld/products");
const JSONLD = resolve(ROOT, "src/data/jsonld");

// ─── Load all JSON data ─────────────────────────────────────────────────────

interface ProductEntry {
  handler: string;
  productGroupId: string;
  name: string;
  catalog: string;
  botanical_name?: string;
  variants: Array<{ sku: string; name: string; size: string; weight_kg?: number }>;
}

interface ContentEntry {
  handler: string;
  qualityBadge?: string;
  shortDescription: string;
  tags: string[];
  commonNames: string[];
  [key: string]: unknown;
}

interface MediaEntry {
  handler: string;
  [key: string]: unknown;
}

interface SeoEntry {
  handler: string;
  [key: string]: unknown;
}

interface InventoryEntry {
  handler: string;
  availability: string;
  variants: Array<{
    sku: string;
    packaging?: string;
    tareWeight_g?: number;
    netWeight_g?: number;
    grossWeight_g?: number;
    stockQty: number;
    availability: string;
    minOrderQty: number;
    maxOrderQty: number;
  }>;
}

interface PricingEntry {
  ProductGroup: {
    handler: string;
    variants: Array<{
      sku: string;
      skuName: string;
      price: number;
      currency: string;
    }>;
  };
}

const products: ProductEntry[] = JSON.parse(
  readFileSync(resolve(DATA, "products.json"), "utf-8"),
).products;

const contentMap = new Map<string, ContentEntry>();
for (const c of JSON.parse(readFileSync(resolve(DATA, "content.json"), "utf-8")).products) {
  contentMap.set(c.handler, c);
}

const mediaMap = new Map<string, MediaEntry>();
for (const m of JSON.parse(readFileSync(resolve(DATA, "media.json"), "utf-8")).products) {
  mediaMap.set(m.handler, m);
}

const seoMap = new Map<string, SeoEntry>();
for (const s of JSON.parse(readFileSync(resolve(DATA, "seo.json"), "utf-8")).products) {
  seoMap.set(s.handler, s);
}

const inventoryMap = new Map<string, InventoryEntry>();
for (const i of JSON.parse(readFileSync(resolve(DATA, "inventory.json"), "utf-8")).products) {
  inventoryMap.set(i.handler, i);
}

const pricingMap = new Map<string, PricingEntry["ProductGroup"]>();
for (const p of JSON.parse(readFileSync(resolve(DATA, "pricing.json"), "utf-8")).products) {
  pricingMap.set(p.ProductGroup.handler, p.ProductGroup);
}

// ─── SQL escape helper ──────────────────────────────────────────────────────

function esc(val: unknown): string {
  if (val === null || val === undefined) return "NULL";
  if (typeof val === "number") return String(val);
  if (typeof val === "object") return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

// ─── Build SQL ──────────────────────────────────────────────────────────────

const sql: string[] = [];

// -- product_groups (46 rows)
for (const p of products) {
  const content = contentMap.get(p.handler);
  const media = mediaMap.get(p.handler);
  const seo = seoMap.get(p.handler);
  const inv = inventoryMap.get(p.handler);

  if (!content || !media || !seo || !inv) {
    throw new Error(`Missing data for handler: ${p.handler}`);
  }

  sql.push(`INSERT INTO product_groups (
  handler, product_group_id, name, catalog, botanical_name,
  availability, quality_badge, tags, common_names, short_description,
  content_json, media_json, seo_json
) VALUES (
  ${esc(p.handler)}, ${esc(p.productGroupId)}, ${esc(p.name)}, ${esc(p.catalog)}, ${esc(p.botanical_name ?? null)},
  ${esc(inv.availability)}, ${esc(content.qualityBadge ?? null)}, ${esc(content.tags)}, ${esc(content.commonNames)}, ${esc(content.shortDescription)},
  ${esc(content)}, ${esc(media)}, ${esc(seo)}
);`);
}

// -- product_variants (132 rows)
// We need the product_group id from the auto-increment, but since we insert in order
// and the table is empty, id = row_number. Use a subquery to be safe.
for (const p of products) {
  const inv = inventoryMap.get(p.handler)!;
  const pricing = pricingMap.get(p.handler)!;

  for (const variant of p.variants) {
    const invVariant = inv.variants.find((v) => v.sku === variant.sku);
    const priceVariant = pricing.variants.find((v) => v.sku === variant.sku);

    if (!invVariant || !priceVariant) {
      throw new Error(`Missing variant data for SKU: ${variant.sku}`);
    }

    sql.push(`INSERT INTO product_variants (
  product_group_id, sku, name, size, weight_kg,
  packaging, tare_weight_g, net_weight_g, gross_weight_g,
  price, currency, stock_qty, availability, min_order_qty, max_order_qty
) VALUES (
  (SELECT id FROM product_groups WHERE handler = ${esc(p.handler)}),
  ${esc(variant.sku)}, ${esc(priceVariant.skuName)}, ${esc(variant.size)}, ${esc(variant.weight_kg ?? null)},
  ${esc(invVariant.packaging ?? null)}, ${esc(invVariant.tareWeight_g ?? null)}, ${esc(invVariant.netWeight_g ?? null)}, ${esc(invVariant.grossWeight_g ?? null)},
  ${esc(priceVariant.price)}, ${esc(priceVariant.currency)}, ${esc(invVariant.stockQty)}, ${esc(invVariant.availability)}, ${esc(invVariant.minOrderQty)}, ${esc(invVariant.maxOrderQty)}
);`);
  }
}

// -- shipping_zones (9 rows)
interface ShippingDetail {
  "@id": string;
  shippingDestination: { addressCountry: string } | Array<{ addressCountry: string }>;
  deliveryTime: {
    handlingTime: { minValue: number; maxValue: number; unitCode: string };
    transitTime: { minValue: number; maxValue: number; unitCode: string };
  };
}

const shippingDetails: ShippingDetail[] = JSON.parse(
  readFileSync(resolve(JSONLD, "OfferShippingDetails.json"), "utf-8"),
);

const zoneLabels: Record<string, string> = {
  "shipping-us": "United States",
  "shipping-ca": "Canada",
  "shipping-latam-caribbean": "Latin America & Caribbean",
  "shipping-europe": "Europe",
  "shipping-middle-east": "Middle East",
  "shipping-africa": "Africa",
  "shipping-asia": "Asia",
  "shipping-oceania": "Oceania",
  "shipping-worldwide": "Worldwide",
};

for (const zone of shippingDetails) {
  const zoneKey = zone["@id"].replace("https://forestal-mt.com/#", "");
  const dest = zone.shippingDestination;
  const codes = Array.isArray(dest) ? dest.map((d) => d.addressCountry) : [dest.addressCountry];
  const h = zone.deliveryTime.handlingTime;
  const t = zone.deliveryTime.transitTime;

  sql.push(`INSERT INTO shipping_zones (
  zone_key, label, country_codes, handling_min, handling_max, transit_min, transit_max, time_unit
) VALUES (
  ${esc(zoneKey)}, ${esc(zoneLabels[zoneKey] ?? zoneKey)}, ${esc(codes)},
  ${esc(h.minValue)}, ${esc(h.maxValue)}, ${esc(t.minValue)}, ${esc(t.maxValue)}, ${esc(h.unitCode)}
);`);
}

// -- return_policies (1 row)
const org = JSON.parse(readFileSync(resolve(JSONLD, "Organization.json"), "utf-8"));
const rp = org.hasMerchantReturnPolicy;

sql.push(`INSERT INTO return_policies (
  policy_key, name, return_days, return_method, return_fees,
  applicable_country, merchant_return_link, description
) VALUES (
  'return-policy', ${esc(rp.name)}, ${esc(rp.merchantReturnDays)},
  ${esc(rp.returnMethod)}, ${esc(rp.returnFees)},
  ${esc(rp.applicableCountry)}, ${esc(rp.merchantReturnLink)}, ${esc(rp.description)}
);`);

// ─── Write and execute ──────────────────────────────────────────────────────

const sqlFile = resolve(ROOT, "drizzle/migrations/seed.sql");
writeFileSync(sqlFile, sql.join("\n"), "utf-8");

console.log(`Generated ${sql.length} SQL statements → ${sqlFile}`);
console.log(`  product_groups: ${products.length}`);
console.log(`  product_variants: ${products.reduce((a, p) => a + p.variants.length, 0)}`);
console.log(`  shipping_zones: ${shippingDetails.length}`);
console.log(`  return_policies: 1`);

// Execute against remote D1
console.log("\nExecuting against remote D1...");
try {
  execSync(`pnpm exec wrangler d1 execute fmt-products-database --remote --file ${sqlFile}`, {
    cwd: resolve(ROOT, "api-worker"),
    stdio: "inherit",
  });
} catch (e) {
  console.error("Seed execution failed:", e);
  process.exit(1);
}

console.log("\nSeed complete!");
