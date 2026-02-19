# PDP E-Commerce Architecture — Static Shell + Live API Layer

**Status:** Design finalized. Implementation pending (pre-cart launch).
**Applies to:** 46 PDPs (`/products/{handler}/`) + Shop page (`/products/`)

---

## The Problem with Pure Static Inventory

PDPs are currently generated at build time from `inventory.json`:

```ts
// src/pages/products/[handler].astro — line 131
const isInStock = inventory.availability === "InStock";
```

This bakes availability into the HTML:

```html
<!-- Static HTML — does not reflect real-time stock -->
In Stock — Ships Worldwide via DHL Express
```

**Consequence when e-commerce is live:** A customer buys the last units → the
next visitor's browser receives an HTML that still says "In Stock" until the
next `pnpm build`. This is a data integrity failure for a live store.

---

## Correct Architecture: Two Separate Layers

The static HTML serves Google. Real-time data serves the customer. These are
independent concerns and must never be mixed.

```
┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 1 — Static HTML (build time, served from Cloudflare CDN)     │
│                                                                      │
│  • Product name, botanical name, description        → SEO ✓         │
│  • Price range ("$12.99 – $89.99")                 → SEO ✓         │
│  • JSON-LD schemas (ProductGroup, Offer, etc.)     → Rich Results ✓ │
│  • <link rel="canonical">                          → Indexing ✓     │
│  • How To Use, Processing Method, Specifications   → SEO ✓         │
│                                                                      │
│  Never changes without a code/data change + deploy.                  │
│  Google crawls this. Performance: ~0ms TTFB from CDN edge.          │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  LAYER 2 — Preact Islands (runtime, client-side fetch)               │
│                                                                      │
│  • Exact SKU prices         → GET /api/products/{handler}/pricing    │
│  • Real-time availability   → GET /api/products/{handler}/inventory  │
│  • Wishlist status          → GET /api/wishlist?sku=...              │
│  • Add to Cart button       → POST /api/cart                         │
│  • Checkout / Order         → POST /api/orders                       │
│                                                                      │
│  Always fresh. Invisible to Google. Powered by fmt-ecommerce-api.    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## What Changes in the PDPs

### Current (static — must be replaced before cart launch)

```astro
{/* src/pages/products/[handler].astro */}

{/* Availability — STATIC, stale after any purchase */}
<p class:list={[isInStock ? "text-leaf-green" : "text-red-600"]}>
  {isInStock ? "In Stock — Ships Worldwide via DHL Express" : "Currently Out of Stock"}
</p>

{/* Variant cards — STATIC price from pricing.json */}
{
  product.variants.map((v) => {
    const vPrice = pricing.variants.find((pv) => pv.sku === v.sku);
    return (
      <div class="rounded-lg border ...">
        <p>{v.size}</p>
        <p>${vPrice.price.toFixed(2)}</p> {/* stale */}
      </div>
    );
  })
}

{/* Cart placeholder — temporary */}
<div class="border-dashed ...">
  <p>Add to Cart — Coming Soon</p>
</div>
```

### Target (Preact island — real-time)

```tsx
// src/components/islands/ProductAvailabilityIsland.tsx

export default function ProductAvailabilityIsland({ handler, variants }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/products/${handler}/availability`)
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      });
  }, [handler]);

  if (loading) return <SkeletonAvailability />;

  return (
    <>
      <p class={data.inStock ? "text-leaf-green" : "text-red-600"}>
        {data.inStock ? "In Stock — Ships via DHL Express" : "Out of Stock"}
      </p>

      <div class="flex flex-wrap gap-2">
        {variants.map((v) => (
          <VariantCard key={v.sku} sku={v.sku} price={data.prices[v.sku]} />
        ))}
      </div>

      <AddToCartButton handler={handler} disabled={!data.inStock} />
    </>
  );
}
```

```astro
{/* [handler].astro — replace static block with island */}
<ProductAvailabilityIsland client:visible handler={product.handler} variants={product.variants} />
```

---

## Complete Purchase Flow

```
1. Customer arrives at PDP
   └── Cloudflare CDN → static HTML (0ms TTFB, SEO-perfect)

2. Preact island hydrates (client:visible)
   └── GET api.forestal-mt.com/products/{handler}/availability
   └── D1 query: SELECT price, qty FROM inventory WHERE handler = ?
   └── Response: { inStock: true, qty: 47, prices: { "RBO-1": 29.99 } }
   └── UI renders real availability + SKU prices

3. Customer selects SKU + quantity → "Add to Cart"
   └── POST api.forestal-mt.com/cart
   └── KV stores cart state (SESSION binding, keyed by session cookie)

4. Customer proceeds to Checkout
   └── POST api.forestal-mt.com/orders
   └── D1: BEGIN TRANSACTION
         INSERT INTO orders (...)
         UPDATE inventory SET qty = qty - ? WHERE sku = ?
       COMMIT
   └── KV: delete session cart
   └── DHL Express API: create shipment, generate Air Waybill (AWB)
   └── Response: { orderId, dhlTrackingNumber, awbPdf }

5. Next customer arrives at same PDP
   └── Same static HTML from CDN (unchanged)
   └── Preact island → D1 now returns qty: 44
   └── UI reflects updated stock
```

---

## DHL Express API Integration

DHL Express handles all shipping logistics: shipment creation, Air Waybill
(AWB) generation, label printing, tracking, and delivery confirmation.

**Integration point:** `fmt-ecommerce-api` Worker, called at order confirmation.

### Key DHL API operations

| Operation             | DHL Endpoint                 | Triggered by                         |
| --------------------- | ---------------------------- | ------------------------------------ |
| Create shipment + AWB | `POST /shipments`            | Order confirmation                   |
| Get rates / quote     | `POST /rates`                | Checkout (shipping cost calculation) |
| Track shipment        | `GET /tracking?number={awb}` | Order status page                    |
| Cancel shipment       | `DELETE /shipments/{id}`     | Order cancellation                   |

### Shipment creation payload (outbound from Honduras)

```json
{
  "plannedShippingDateAndTime": "2026-03-01T10:00:00Z",
  "pickup": { "isRequested": false },
  "productCode": "P",
  "accounts": [{ "typeCode": "shipper", "number": "DHL_ACCOUNT_NUMBER" }],
  "shipper": {
    "name": "Forestal Murillo Tejada S. de R.L.",
    "address": {
      "addressLine1": "Barrio Arriba",
      "cityName": "San Francisco de la Paz",
      "countryCode": "HN",
      "postalCode": "16102"
    }
  },
  "receiver": {
    /* from order data */
  },
  "packages": [{ "weight": 1.5, "dimensions": { "length": 20, "width": 15, "height": 10 } }],
  "content": {
    "description": "Ethnobotanical products — Forestal MT",
    "incoterm": "DAP",
    "exportDeclaration": {
      /* COO, HS codes, value */
    }
  }
}
```

### AWB / Label flow

```
Order confirmed
  └── Worker calls DHL POST /shipments
  └── DHL returns: { shipmentTrackingNumber, documents: [{ content: base64PDF }] }
  └── Worker stores AWB PDF in R2: r2.put(`awbs/${orderId}.pdf`, pdfBuffer)
  └── Worker emails tracking number + AWB link to customer
  └── Admin dashboard shows AWB download link
```

---

## What Does NOT Change

The following are SSG-forever, never touched by the API layer:

- `<link rel="canonical">` — baked into HTML, handles all URL parameters
- JSON-LD `@graph` (ProductGroup, Offer, BreadcrumbList) — baked at build time
- Price range in JSON-LD (`priceSpecification`) — updated via JSON data files + rebuild (Google crawl cycle is 2–4 weeks; this lag is acceptable)
- Product copy, How to Use, Processing Method, Specifications — content changes require a deploy
- Hero image, variant images — R2 CDN, no change

---

## State Comparison: Now vs. E-Commerce Launch

| Feature           | Now (pre-launch)             | At e-commerce launch                |
| ----------------- | ---------------------------- | ----------------------------------- |
| Inventory display | Static from `inventory.json` | Preact island → API Worker → D1     |
| SKU prices        | Static from `pricing.json`   | Preact island → API Worker → D1     |
| Wishlist          | Not implemented              | API Worker + KV (session)           |
| Cart              | Placeholder ("Coming Soon")  | Preact island → API Worker + KV     |
| Orders            | Not implemented              | API Worker → D1 + DHL Express API   |
| Shipping quotes   | Not implemented              | API Worker → DHL Rates API          |
| AWB / Labels      | Not implemented              | API Worker → DHL Shipments API → R2 |
| Tracking          | Not implemented              | Order page → DHL Tracking API       |
| SEO content       | Static ✓                     | Static ✓ (unchanged)                |
| JSON-LD schemas   | Static ✓                     | Static ✓ (unchanged)                |
| Canonicals        | Static ✓                     | Static ✓ (unchanged)                |

---

## Pre-Launch Checklist (when activating cart)

- [ ] Replace static availability block in `[handler].astro` with `ProductAvailabilityIsland`
- [ ] Build `GET /api/products/{handler}/availability` endpoint in `fmt-ecommerce-api`
- [ ] Build `POST /api/cart` + `GET /api/cart` endpoints
- [ ] Build `POST /api/orders` endpoint with D1 transaction (INSERT order + UPDATE inventory)
- [ ] Integrate DHL Express API: `POST /shipments` on order confirm
- [ ] Store AWB PDFs in R2 bucket (`awbs/` prefix)
- [ ] Bind KV `SESSION` namespace in Cloudflare Pages dashboard (prod + preview)
- [ ] Add `api.forestal-mt.com` DNS record pointing to `fmt-ecommerce-api` Worker
- [ ] Implement CORS on API Worker to allow requests from `forestal-mt.com`
- [ ] Add DHL account credentials to Worker secrets (`DHL_API_KEY`, `DHL_ACCOUNT_NUMBER`)
- [ ] End-to-end test: add to cart → checkout → D1 inventory decremented → AWB generated

---

## Architecture Constraint: No SSR Required

The PDPs do **not** need `output: "hybrid"` (Astro SSR) for e-commerce to work.
The static HTML shell + client-side Preact islands + external API Worker is the
correct model. SSR adds latency and cost; this model delivers:

- Fastest possible TTFB (CDN-served static HTML)
- Real-time data where it matters (availability, cart state)
- Google indexes full product content from static HTML
- DHL integration lives entirely in the API Worker, separate from the page layer

**Do not switch to `output: "hybrid"` for PDPs unless there is a specific
requirement that cannot be met by client-side fetching.**
