# Forestal MT — SEO & Structured Data Specification

**Document version:** 2.0
**Last updated:** 2026-02-17
**Language:** English
**Parent document:** `SITE_TECHNICAL_SPEC.md`
**Applies to:** forestal-mt.com and all related Forestal MT web projects

---

## 1. SEO

SEO is a first-class architectural concern, not an afterthought. Every page must be indexable, fast, and structured for search engines from day one.

### Head Component

A custom `<Head>` Astro component handles all meta tag generation. No third-party SEO packages — the component is built in-house, type-safe, and fed directly from `seo.json` (products) or frontmatter (static pages).

### Meta Tags

- Every page must have unique `<title>` (max 60 chars) and `<meta name="description">` (max 160 chars)
- Product pages: values from `seo.json` (authoritative source, queried from D1)
- Static pages: defined in Astro frontmatter or layout

### Open Graph

- Every page must have `og:title`, `og:description`, `og:image`, `og:url`, `og:type`
- Product OG images: `cdn.forestal-mt.com/products/og/{handler}.png` (from `media.json`)
- Static page OG images: `cdn.forestal-mt.com/pages/og/{page-slug}.png`
- All OG images: 1200x630, PNG

### Twitter Cards

- All pages: `twitter:card = summary_large_image`

### Canonical URLs

- Every page must have `<link rel="canonical" href="{full URL with trailing slash}">`
- Product canonical: `https://forestal-mt.com/products/{handler}/`
- No duplicate content — one URL per page, enforced by trailing slash redirect

### Robots Directives

- `index,follow` pages: all public content (Home, About, Catalogue, PDPs, Shop, Community, Legal)
- `noindex,follow` pages: utility pages (404, Login, Register)
- `noindex,nofollow` pages: transactional/authenticated (Cart, Checkout, Account, Admin, Forgot/Reset Password)

### Sitemap

Generated via `@astrojs/sitemap` integration with hybrid approach:

- **Static pages:** auto-discovered at build time
- **SSR pages (46 PDPs + Shop):** `@astrojs/sitemap` cannot discover dynamic SSR routes — use custom `src/pages/sitemap.xml.ts` endpoint that queries D1 for all handlers at request time
- **Filter:** excludes `noindex` pages (cart, checkout, account, admin, utility)
- **Discovery:** `<link rel="sitemap">` in `<head>` + `Sitemap:` directive in `robots.txt`
- Submitted to Google Search Console and Bing Webmaster Tools

```js
// astro.config.mjs
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://forestal-mt.com',
  integrations: [
    sitemap({
      filter: (page) =>
        !page.includes('/cart/') &&
        !page.includes('/checkout/') &&
        !page.includes('/account/') &&
        !page.includes('/admin/') &&
        !page.includes('/login/') &&
        !page.includes('/register/') &&
        !page.includes('/forgot-password/') &&
        !page.includes('/reset-password/') &&
        !page.includes('/order-confirmation/') &&
        !page.includes('/order-tracking/'),
    }),
  ],
});
```

---

## 2. Structured Data (JSON-LD)

### Architecture

Structured data is implemented as JSON-LD `<script type="application/ld+json">` blocks in the `<head>` of each page. Uses a unified `@graph` pattern with schema.org vocabulary. Validated with Zod schemas at build time to catch errors before deployment.

### E-E-A-T Signals

| Signal | Implementation |
|--------|---------------|
| **Experience** | Product sourcing stories, harvesting process descriptions, origin community context |
| **Expertise** | Botanical nomenclature, traditional use documentation, ethnobotanical references |
| **Authoritativeness** | Organization schema, brand schema, direct-from-origin claims, company legal entity |
| **Trustworthiness** | Complete contact info, physical address, legal disclaimers, transparent sourcing |

### @graph Pattern

Each page outputs a single JSON-LD block with an `@graph` array containing all relevant nodes. This consolidates structured data into one parseable block instead of scattered `<script>` tags.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "Organization", "..." : "..." },
    { "@type": "WebSite", "..." : "..." },
    { "@type": "BreadcrumbList", "..." : "..." },
    { "@type": "Product", "..." : "..." }
  ]
}
```

### Schema Nodes per Page Type

**Google processes structured data page-by-page** — `@id` references are NOT resolved across pages for Rich Results. However, consistent `@id` values across pages DO help Google build entity relationships for the Knowledge Graph over time. This requires a hybrid approach.

**Compact nodes (all pages except Home):** Every page includes a lightweight Organization and Brand stub (`@type`, `@id`, `name`, `url`, `logo`) to reinforce entity identity for Knowledge Graph. These are NOT full definitions — just enough for Google to associate the page with the entity.

**Full nodes (Home only):** The Home page includes the complete Organization, Brand, and WebSite definitions with all properties (contacts, founders, return policy, etc.).

The frontmatter `schemas[]` uses `mode: compact` to signal this to the builder:
- No `mode` → builder injects the full JSON-LD file
- `mode: compact` → builder injects only the stub (`@type`, `@id`, `name`, `url`, `logo`)

| Page Type | Nodes in @graph |
|-----------|----------------|
| Home | `WebSite`, `Organization` (full), `Brand` (full), `SearchAction`, `VideoObject`, `ImageObject` |
| About | `Organization` (compact), `Brand` (compact), `AboutPage`, `ImageObject`, `BreadcrumbList` |
| Catalogue pages | `Organization` (compact), `Brand` (compact), `AboutPage`, `OfferCatalog`, `VideoObject`, `ImageObject`, `BreadcrumbList` |
| PDPs | `Organization` (compact), `Brand` (compact), `ProductGroup`, `Product` (hasVariant), `Offer`, `ImageObject`, `HowTo`, `BreadcrumbList` |
| Shop | `Organization` (compact), `Brand` (compact), `OnlineStore`, `CollectionPage`, `ItemList`, `OfferShippingDetails` (x9), `ImageObject`, `BreadcrumbList` |
| FAQs | `Organization` (compact), `Brand` (compact), `FAQPage`, `Question`/`Answer`, `ImageObject`, `BreadcrumbList` |
| Blog & Stories | `Organization` (compact), `Brand` (compact), `Blog`, `BlogPosting`, `ImageObject`, `BreadcrumbList` |
| Contact | `Organization` (compact), `Brand` (compact), `ContactPage`, `ImageObject`, `BreadcrumbList` |
| Wholesale | `Organization` (compact), `Brand` (compact), `WebPage`, `Service` (x4), `ImageObject`, `BreadcrumbList` |
| Community | `Organization` (compact), `Brand` (compact), `WebPage`, `ImageObject`, `BreadcrumbList` |
| Testimonials | `Organization` (compact), `Brand` (compact), `WebPage`, `Review`, `ImageObject`, `BreadcrumbList` |
| Documentation | `Organization` (compact), `Brand` (compact), `WebPage`, `ImageObject`, `BreadcrumbList` |
| Legal pages | `Organization` (compact), `Brand` (compact), `WebPage`, `BreadcrumbList` |
| Utility pages | `Organization` (compact), `Brand` (compact), `WebPage`, `ImageObject` |

**Entity rendering:**

| Entity | Full node on | Compact stub on |
|--------|-------------|-----------------|
| `Organization` | Home | All other pages |
| `Brand` | Home | All other pages |
| `WebSite` | Home | Not included elsewhere |
| `OnlineStore` | Shop | Not included elsewhere |

**Compact stub format (builder contract):**
```json
{
  "@type": "Organization",
  "@id": "https://forestal-mt.com/#organization",
  "name": "Forestal MT",
  "url": "https://forestal-mt.com/",
  "logo": "https://forestal-mt.com/logo.png"
}
```

**URL convention:** All URLs use trailing slash — domain (`https://forestal-mt.com/`) and pages (`https://forestal-mt.com/about/`). `@id` values do NOT use trailing slash (they use fragment identifiers: `https://forestal-mt.com/#organization`).

### SearchAction

Enables Google Sitelinks Search Box — a search input displayed directly in Google SERP results when users search for "Forestal MT" or brand-related queries. This is premium SERP real estate.

**Schema source:** `structured-data/jsonld/WebSite.json` → `potentialAction`

```json
{
  "@type": "SearchAction",
  "target": {
    "@type": "EntryPoint",
    "urlTemplate": "https://forestal-mt.com/products/?q={search_term_string}"
  },
  "query-input": "required name=search_term_string"
}
```

**Contract:** The Shop page (`/products/`) MUST implement `?q=` query param for server-side product filtering via D1. Google sends users directly to this URL from the Sitelinks Search Box. If the page does not return filtered results, Google disables the feature.

**Relationship with header search box:** The SearchAction and the header autocomplete search are complementary — not redundant. SearchAction captures traffic from Google SERP; header autocomplete improves on-site navigation (typeahead → PDP direct). Both are primary features.

### @id Reference Graph

**Critical:** Google does NOT resolve `@id` references across pages. It processes each page's structured data independently. `@id` references only work within the same page's `@graph` array.

Schema nodes on the **same page** connect via `@id`. On the Home page, Organization, Brand, and WebSite coexist in one `@graph` and reference each other via `@id`. On the Shop page, OnlineStore stands alone.

```
HOME PAGE @graph:
  Organization (#organization)
  ├── brand: { @id: #brand }
  │
  WebSite (#website)
  │ publisher: { @id: #organization }
  │
  Brand (#brand)
    owner: { @id: #organization }

SHOP PAGE @graph:
  OnlineStore (#store)
  │ (self-contained, no cross-page @id refs)
```

**Node relationships (same-page, schema.org validated):**

| From → To | Property | Page | Direction |
|-----------|----------|------|-----------|
| WebSite → Organization | `publisher` | Home | Child → parent |
| Brand → Organization | `owner` | Home | Child → parent |
| Organization → Brand | `brand` | Home | Parent → child |

**Static vs dynamic nodes:**

| Node | Where defined | How delivered |
|------|--------------|---------------|
| Organization | `structured-data/jsonld/Organization.json` | Included in Home page `@graph` (static) |
| WebSite | `structured-data/jsonld/WebSite.json` | Included in Home page `@graph` (static) |
| Brand | `structured-data/jsonld/Brand.json` | Inline within Organization; also referenced by Product nodes |
| OnlineStore | `structured-data/jsonld/OnlineStore.json` | Included in Shop page `@graph` (SSR) |
| OfferShippingDetails | `structured-data/jsonld/OfferShippingDetails.json` | 9 regional shipping zones; rendered on Shop page @graph, referenced by Offer nodes via `@id` |
| Service (x4) | `structured-data/jsonld/Service-wholesale.json` | 4 B2B services (wholesale, private label, custom packaging, export logistics); rendered on Wholesale page @graph |
| VideoObject (x4) | `structured-data/jsonld/VideoObject-*.json` | Included in Home + 3 Catalogue page `@graph` (static) |
| ProductGroup (x46) | `structured-data/jsonld/ProductGroup-all-products.json` | Reference manifest; includes hasVariant, ImageObject, Offer per variant |
| HowTo (x46) | `structured-data/jsonld/HowTo-all-products.json` | Reference manifest; SSR pages build from D1 `content.howToUse` |
| BreadcrumbList (x79) | `structured-data/jsonld/BreadcrumbList-all-pages.json` | Reference manifest; PDPs use Home > Catalog > Product pattern |

**Static JSON files** (Organization, Brand, WebSite, OnlineStore, OfferShippingDetails, VideoObject, Service-wholesale) are imported and injected as-is. OfferShippingDetails (9 nodes) are rendered on the Shop page @graph — this is where the full definitions live that Offer nodes reference via @id. Service (4 nodes) are rendered on the Wholesale page @graph. **Reference manifests** (ProductGroup, HowTo, BreadcrumbList) are NOT imported at runtime — they exist for validation and documentation. Page-level schemas are built from D1 query results by a builder utility (`src/lib/jsonld.ts`).

### schema.org Type Hierarchy

This section documents the schema.org type hierarchy and property ownership relevant to Forestal MT structured data. This is the permanent reference for all schema decisions — when in doubt, check property ownership here before assigning properties to nodes.

**Type hierarchy (Thing → ... → Leaf):**

```
Thing
├── CreativeWork
│   ├── HowTo
│   ├── MediaObject → ImageObject
│   ├── MediaObject → VideoObject
│   └── WebPage
│       ├── CollectionPage
│       └── ContactPage
├── Intangible
│   ├── Brand
│   ├── BreadcrumbList (ItemList)
│   ├── ItemList → OfferCatalog
│   ├── ListItem
│   ├── MerchantReturnPolicy
│   ├── Offer
│   ├── OfferShippingDetails
│   ├── Service
│   └── StructuredValue → DefinedRegion
├── Organization
│   └── LocalBusiness → Store → OnlineBusiness → OnlineStore
├── Product
│   └── ProductGroup
└── WebSite
```

**Property ownership table (which types can carry which properties):**

| Property | Valid on Types | Range (value type) | Forestal MT Usage |
|----------|---------------|-------------------|-------------------|
| `shippingDetails` | **Offer ONLY** | OfferShippingDetails | 9 @id refs on each of 132 variant Offers |
| `hasMerchantReturnPolicy` | Offer, Organization, Product | MerchantReturnPolicy | Inline on Organization, @id ref on each Offer |
| `hasOfferCatalog` | Organization, Person, Service | OfferCatalog | On OnlineStore (3 sub-catalogs) + on Wholesale Supply service (@id ref to #catalog) |
| `hasShippingService` | Organization, OfferShippingDetails | ShippingService | NOT used — different type from OfferShippingDetails |
| `brand` | Organization, Product, Service | Brand, Organization | On Organization (inline+@id), ProductGroup (@id ref), OnlineStore (@id ref) |
| `parentOrganization` | Organization | Organization | OnlineStore → Organization |
| `publisher` | CreativeWork | Organization, Person | WebSite → Organization |
| `seller` | Offer | Organization, Person | Each Offer → Organization @id ref |
| `provider` | Service, CreativeWork, others | Organization, Person | Each Service → Organization @id ref |
| `variesBy` | ProductGroup | DefinedTerm, text | "https://schema.org/size" on all 46 ProductGroups |

**Key rules derived from this table:**
1. `shippingDetails` goes on **Offer nodes**, NOT on OnlineStore or Organization
2. `hasMerchantReturnPolicy` goes on **both** Organization (declares policy) AND Offer nodes (for Product rich results)
3. `hasOfferCatalog` goes on **OnlineStore** (valid because OnlineStore inherits from Organization)
4. `hasShippingService` is a DIFFERENT property from `shippingDetails` — do not confuse them
5. OfferShippingDetails nodes are **defined once** on the Shop page @graph and **referenced via @id** by all 132 Offers

### JSON-LD Builder Contract

A single builder utility (`src/lib/jsonld.ts`) assembles the `@graph` for every page type. Each page calls one function, receives a complete JSON-LD object, and injects it into `<head>`. The builder consumes static JSON files from the suite and dynamic data from D1.

**Interface:**

```ts
// src/lib/jsonld.ts
type PageType = "home" | "about" | "pdp" | "shop" | "catalog" | "wholesale" | "contact" | "community" | "faq" | "blog" | "legal";

interface JsonLdGraph {
  "@context": "https://schema.org";
  "@graph": Record<string, unknown>[];
}

export function buildJsonLd(page: PageType, data?: Record<string, unknown>): JsonLdGraph;
```

**Builder inputs per page type:**

| Page Type | Static JSON Imports | D1 Data (via `data` param) | Output @graph Nodes |
|-----------|--------------------|-----------------------------|---------------------|
| `home` | Organization, WebSite, Brand, VideoObject-home-hero | — | Organization, WebSite, SearchAction, VideoObject, ImageObject |
| `about` | Organization | — | Organization, ImageObject, BreadcrumbList |
| `pdp` | — | handler → products, pricing, media, seo, content, inventory | ProductGroup, Product[] (hasVariant), Offer[], ImageObject, HowTo, BreadcrumbList |
| `shop` | OnlineStore, OfferShippingDetails | products (all or filtered by ?q=) | OnlineStore, CollectionPage, ItemList, OfferShippingDetails (x9), BreadcrumbList |
| `catalog` | VideoObject-{catalog}-hero | catalog slug → products in catalog | CollectionPage, OfferCatalog, VideoObject, BreadcrumbList |
| `wholesale` | Service-wholesale | — | WebPage, Service (x4), BreadcrumbList |
| `contact` | Organization | — | ContactPage, Organization, ImageObject, BreadcrumbList |
| `community` | — | — | WebPage, ImageObject, BreadcrumbList |
| `faq` | — | FAQ content | FAQPage, Question/Answer, ImageObject, BreadcrumbList |
| `blog` | — | blog posts | Blog, BlogPosting, ImageObject, BreadcrumbList |
| `legal` | — | — | WebPage, BreadcrumbList |

**Rules:**
1. One function, one page type, one `@graph` — no scattered `<script>` tags
2. Static JSON files are imported once at module level, not per-request
3. D1 queries happen in the Astro page, results passed to the builder via `data`
4. The builder NEVER queries D1 directly — it receives data, it does not fetch
5. Every `@graph` node must have `@type`; nodes referenced within the same page's `@graph` must have `@id`
6. BreadcrumbList is built by the builder for every page except Home

**Usage in Astro pages:**

```astro
---
// Any page — same pattern everywhere
import { buildJsonLd } from "../lib/jsonld";

// For static pages (no D1 data needed):
const jsonLd = buildJsonLd("wholesale");

// For dynamic pages (D1 data required):
const db = Astro.locals.runtime.env.DB;
const product = await db.prepare("SELECT * FROM products WHERE handler = ?").bind(handler).first();
// ... more queries ...
const jsonLd = buildJsonLd("pdp", { product, pricing, media, seo, content, inventory });
---
<head>
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)} />
</head>
```

### Reference Data per Page Type

The following examples show the exact `@graph` content each page type produces. These are the source of truth for what the builder must output — not how it assembles it internally.

**Product Detail Page (PDP):**

`buildJsonLd("pdp", { product, pricing, media, seo, content, inventory })` — D1 data for one handler.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ProductGroup",
      "@id": "https://forestal-mt.com/products/{handler}/#product-group",
      "name": "{product.name}",
      "productGroupID": "{product.productGroupId}",
      "description": "{seo.seoDescription}",
      "url": "https://forestal-mt.com/products/{handler}/",
      "brand": { "@id": "https://forestal-mt.com/#brand" },
      "image": { "@id": "https://forestal-mt.com/products/{handler}/#image" },
      "variesBy": "https://schema.org/size",
      "hasVariant": [
        {
          "@type": "Product",
          "name": "{variant.name}",
          "sku": "{variant.sku}",
          "size": "{inventory.size}",
          "image": "{media.variantImages[sku].url}",
          "offers": {
            "@type": "Offer",
            "url": "https://forestal-mt.com/products/{handler}/",
            "price": "{pricing.price}",
            "priceCurrency": "USD",
            "availability": "https://schema.org/{inventory.availability}",
            "seller": { "@id": "https://forestal-mt.com/#organization" },
            "shippingDetails": [
              { "@id": "https://forestal-mt.com/#shipping-us" },
              { "@id": "https://forestal-mt.com/#shipping-ca" },
              { "@id": "https://forestal-mt.com/#shipping-latam-caribbean" },
              { "@id": "https://forestal-mt.com/#shipping-europe" },
              { "@id": "https://forestal-mt.com/#shipping-middle-east" },
              { "@id": "https://forestal-mt.com/#shipping-africa" },
              { "@id": "https://forestal-mt.com/#shipping-asia" },
              { "@id": "https://forestal-mt.com/#shipping-oceania" },
              { "@id": "https://forestal-mt.com/#shipping-worldwide" }
            ],
            "hasMerchantReturnPolicy": { "@id": "https://forestal-mt.com/#return-policy" }
          }
        }
      ]
    },
    {
      "@type": "ImageObject",
      "@id": "https://forestal-mt.com/products/{handler}/#image",
      "name": "{product.name} — Product Image",
      "description": "{media.image.alt}",
      "caption": "{media.image.caption}",
      "url": "{media.image.url}",
      "contentUrl": "{media.image.url}",
      "width": 1200,
      "height": 1200,
      "encodingFormat": "image/png",
      "inLanguage": "en",
      "datePublished": "{media.image.uploadedDate}",
      "copyrightYear": 2026,
      "copyrightHolder": { "@id": "https://forestal-mt.com/#organization" },
      "creator": { "@id": "https://forestal-mt.com/#organization" },
      "representativeOfPage": true
    },
    {
      "@type": "BreadcrumbList",
      "@id": "https://forestal-mt.com/products/{handler}/#breadcrumb",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://forestal-mt.com/" },
        { "@type": "ListItem", "position": 2, "name": "{product.catalog}", "item": "https://forestal-mt.com/{catalogSlug}/" },
        { "@type": "ListItem", "position": 3, "name": "{product.name}" }
      ]
    },
    {
      "@type": "HowTo",
      "@id": "https://forestal-mt.com/products/{handler}/#howto",
      "name": "How to Use {product.name}",
      "description": "{content.shortDescription}",
      "supply": [{ "@type": "HowToSupply", "name": "{product.name}" }],
      "step": [
        {
          "@type": "HowToStep",
          "position": 1,
          "name": "{parsed step title}",
          "text": "{parsed step instructions}"
        }
      ]
    }
  ]
}
```

**Shop Page:**

`buildJsonLd("shop", { products })` — D1 products (all or filtered by `?q=`). Renders the most nodes of any page — OnlineStore + 9 OfferShippingDetails definitions that 132 Offers reference via @id.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    "← OnlineStore (from OnlineStore.json — includes hasOfferCatalog)",
    {
      "@type": "CollectionPage",
      "name": "Shop All Products — Forestal MT",
      "url": "https://forestal-mt.com/products/",
      "description": "Browse 46 premium ethnobotanical products from Honduras.",
      "isPartOf": { "@id": "https://forestal-mt.com/#website" },
      "provider": { "@id": "https://forestal-mt.com/#organization" }
    },
    {
      "@type": "ItemList",
      "numberOfItems": "{products.length}",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "url": "https://forestal-mt.com/products/{handler}/" }
      ]
    },
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://forestal-mt.com/" },
        { "@type": "ListItem", "position": 2, "name": "Shop" }
      ]
    },
    "← OfferShippingDetails (x9 from OfferShippingDetails.json)"
  ]
}
```

**Catalogue Page (batana-oil, stingless-bee-honey, traditional-herbs):**

`buildJsonLd("catalog", { catalog, products })` — D1 products for one catalog. OfferCatalog @id matches OnlineStore's `hasOfferCatalog` sub-catalogs.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "CollectionPage",
      "name": "{catalogName} — Forestal MT",
      "url": "https://forestal-mt.com/{catalogSlug}/",
      "description": "Browse {count} {catalogName} products from Forestal MT.",
      "isPartOf": { "@id": "https://forestal-mt.com/#website" },
      "provider": { "@id": "https://forestal-mt.com/#organization" }
    },
    {
      "@type": "OfferCatalog",
      "@id": "https://forestal-mt.com/{catalogSlug}/#catalog",
      "name": "{catalogName}",
      "url": "https://forestal-mt.com/{catalogSlug}/",
      "numberOfItems": "{products.length}",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "{product.name}",
          "url": "https://forestal-mt.com/products/{handler}/",
          "item": { "@id": "https://forestal-mt.com/products/{handler}/#product-group" }
        }
      ]
    },
    "← VideoObject (from VideoObject-{catalogSlug}-hero.json)",
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://forestal-mt.com/" },
        { "@type": "ListItem", "position": 2, "name": "{catalogName}" }
      ]
    }
  ]
}
```

**Wholesale Page:**

`buildJsonLd("wholesale")` — no D1 data needed (static services). Declares B2B services as `Service` nodes so Google classifies Forestal MT as a service provider for queries like "private label batana oil supplier".

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebPage",
      "name": "Wholesale & Private Label — Forestal MT",
      "url": "https://forestal-mt.com/wholesale/",
      "description": "Partner with Forestal MT for wholesale bulk supply, private label manufacturing, custom packaging, and export logistics. Premium ethnobotanical products sourced directly from Honduras.",
      "isPartOf": { "@id": "https://forestal-mt.com/#website" },
      "about": { "@id": "https://forestal-mt.com/#organization" }
    },
    "← Service (x4 from Service-wholesale.json)",
    {
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://forestal-mt.com/" },
        { "@type": "ListItem", "position": 2, "name": "Wholesale" }
      ]
    }
  ]
}
```

**Key points:**
- Static nodes (Organization, Brand, WebSite) are defined once in their JSON files and output on the Home page
- Dynamic nodes (ProductGroup, Product, Offer, ImageObject) are self-contained on each PDP — Google does NOT resolve `@id` across pages
- `shippingDetails` (9 regions): each PDP's Offer must include its own OfferShippingDetails inline or the full node in its `@graph` — cannot reference the Shop page's definitions cross-page
- `hasMerchantReturnPolicy`: each Offer that needs it must include MerchantReturnPolicy inline — cannot reference Organization's definition cross-page
- `Service` nodes (x4) are declared on the **Wholesale** page — provider refs back to Organization, wholesale-supply also refs `#catalog` via `hasOfferCatalog`
- The builder imports static JSON files at module level and injects them into the `@graph` — pages never import JSONs directly

### ProductGroup Schema (PDPs)

Each PDP uses `ProductGroup` (not plain `Product`) as its root entity. This is the correct schema.org pattern for products with size/weight variants — Google uses it for variant-aware rich results and Google Merchant Center integration.

**Schema structure:**

| Field | Source | Notes |
|-------|--------|-------|
| `@type` | `"ProductGroup"` | Fixed |
| `@id` | `{SITE_URL}/products/{handler}/#product-group` | Fragment for graph resolution |
| `name` | `products.name` | ProductGroup display name |
| `productGroupID` | `products.productGroupId` | e.g., "FMT-TH-BL" |
| `description` | `seo.seoDescription` | Meta description reused |
| `url` | `products.url` | Canonical PDP URL |
| `brand` | `{ "@id": "#brand" }` | Ref to Brand node |
| `image` | `{ "@id": ".../#image" }` | Ref to ImageObject in same @graph |
| `variesBy` | `"https://schema.org/size"` | Fixed — all products vary by size |
| `hasVariant[]` | Joined from products + pricing + media + inventory | Array of Product nodes |

**hasVariant — each variant is a Product with its own Offer:**

| Field | Source | Notes |
|-------|--------|-------|
| `@type` | `"Product"` | Each variant is a full Product |
| `name` | `products.variants[].name` | Full variant name with size |
| `sku` | `products.variants[].sku` | Unique SKU identifier |
| `size` | `inventory.variants[].size` | Metric-only (e.g., "57 g") |
| `image` | `media.variantImages[].url` | Plain URL (not ImageObject) |
| `offers.price` | `pricing.variants[].price` | USD, 2 decimals |
| `offers.availability` | `inventory.variants[].availability` | InStock or OutOfStock |
| `offers.shippingDetails` | 9 `@id` refs (static) | Refs to OfferShippingDetails nodes rendered on Shop page |
| `offers.hasMerchantReturnPolicy` | `@id` ref (static) | Ref to `#return-policy` defined inline on Organization |

**ImageObject — one per PDP, representative of page:**

| Field | Source | Notes |
|-------|--------|-------|
| `@type` | `"ImageObject"` | Fixed |
| `@id` | `{SITE_URL}/products/{handler}/#image` | Referenced by ProductGroup.image |
| `url`, `contentUrl` | `media.image.url` | ProductGroup main image (1200x1200) |
| `description` | `media.image.alt` | Alt text |
| `caption` | `media.image.caption` | Descriptive caption |
| `representativeOfPage` | `true` | Signals this is THE page image |
| `creator`, `copyrightHolder` | `{ "@id": "#organization" }` | Organization ref |

**Coverage:** 46 ProductGroups, 132 variant Products, 132 Offers, 46 ImageObjects.

**Variant images are plain URLs on each Product node**, not standalone ImageObjects. The ProductGroup image gets the full ImageObject treatment because it's the representative page image (Google Image Search, Knowledge Panel).

**Reference file:** `structured-data/jsonld/ProductGroup-all-products.json` — pre-generated manifest with all 46 ProductGroup schemas including hasVariant, ImageObject, and Offer nodes.

### HowTo Schema (PDPs)

Each PDP includes a `HowTo` node in its `@graph` array, generated from `content.json → howToUse[]` at SSR time.

**Strategic rationale:** Google deprecated HowTo rich results in September 2023. We implement HowTo schemas for:
- **Semantic understanding** — helps Google's Knowledge Graph classify product usage
- **SGE/LLM preparation** — structured how-to data feeds AI-generated answers
- **Bing support** — Bing still renders HowTo rich results
- **Featured Snippets** — step-by-step data can surface in People Also Ask and Featured Snippets

**Schema structure:**

| Field | Source | Notes |
|-------|--------|-------|
| `@type` | `"HowTo"` | Fixed |
| `@id` | `{SITE_URL}/products/{handler}/#howto` | Fragment for graph resolution |
| `name` | `"How to Use {product.name}"` | SEO-friendly descriptive title |
| `description` | `content.shortDescription` | Reuses existing editorial copy |
| `supply[0]` | `{ "@type": "HowToSupply", "name": product.name }` | The product itself |
| `step[]` | Parsed from `content.howToUse[]` | Each string → one HowToStep |

**Step parsing:** Each `howToUse` string follows the pattern `"Step Title: Instructions..."`. Split on first `: ` — left = `name`, right = `text`. For strings without `: `, fallback: `name = "Step {N}"`, `text = full string`.

**Coverage:** 46 products, 231 total steps (4-6 per product). 4 steps use fallback names (batana-oil-hair-conditioner step 5, duck-flower steps 2-4).

**Not included:** `tool`, `estimatedCost`, `totalTime`, `yield` — not applicable for ethnobotanical product usage. No per-step images — product images are in the Product node.

**Reference file:** `structured-data/jsonld/HowTo-all-products.json` — pre-generated manifest of all 46 HowTo schemas for validation and review. At runtime, HowTo nodes are built by Astro SSR from D1 queries.

### BreadcrumbList Schema (All Pages)

Every page (except Home) includes a `BreadcrumbList` node in its `@graph` array. Breadcrumbs are pre-generated for all 79 pages and documented in the reference manifest.

**PDP breadcrumb pattern:** `Home > {Catalog} > {Product}`

| Catalog | Breadcrumb Example | Catalog URL |
|---------|-------------------|-------------|
| Batana Oil | Home > Batana Oil > Raw Batana Oil | `/batana-oil/` |
| Stingless Bee Honey | Home > Stingless Bee Honey > Jimerito | `/stingless-bee-honey/` |
| Traditional Herbs | Home > Traditional Herbs > Amaranth Greens | `/traditional-herbs/` |

**Why Catalog instead of Shop in PDP breadcrumbs:** Linking to the catalog page (`/batana-oil/`, etc.) provides stronger topical hierarchy in SERPs, more internal link juice to catalog pages, and Google renders it as `forestal-mt.com › Batana Oil › Raw Batana Oil`. Shop (`/products/`) is already linked from the main navigation.

**Other page patterns:**

| Page Type | Breadcrumb Pattern | Example |
|-----------|--------------------|---------|
| Core pages | Home > {Page} | Home > About Us |
| Community subpages | Home > Community > {Subpage} | Home > Community > FAQs |
| Legal pages | Home > {Page} | Home > Privacy Policy |
| Shop | Home > Shop | — |
| E-commerce | Home > {Page} | Home > Cart |
| Account subpages | Home > My Account > {Subpage} | Home > My Account > My Orders |
| Admin subpages | Home > Admin Dashboard > {Subpage} | Home > Admin Dashboard > Product Management |

**Google guidelines:** Last item in the breadcrumb has no `item` URL (represents the current page). All parent items include `item` URLs for navigation.

**Reference file:** `structured-data/jsonld/BreadcrumbList-all-pages.json` — pre-generated manifest with BreadcrumbList schemas for all 79 pages (Home excluded). Static pages embed at build time; SSR pages build from D1 at runtime.

### Validation

- **Build-time:** Zod schemas validate every JSON-LD block structure before output
- **Runtime:** Google Rich Results Test and Schema Markup Validator for live verification
- **CI:** Lighthouse CI checks for structured data errors in automated pipeline
- **Post-launch:** Google Search Console → Search Appearance → Sitelinks to verify SearchAction activation

---

*Forestal Murillo Tejada S. de R.L. - Forestal MT*
