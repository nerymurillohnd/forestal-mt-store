# Forestal MT — Site Technical Specification

**Document version:** 2.4
**Last updated:** 2026-02-21
**Language:** English
**Applies to:** forestal-mt.com and all related Forestal MT web projects

---

## 1. Stack

| Layer               | Technology            | Service                                                         |
| ------------------- | --------------------- | --------------------------------------------------------------- |
| Framework           | Astro 5.7+            | SSG, Islands Architecture                                       |
| UI framework        | Preact                | Interactive islands, React-compatible API (3KB)                 |
| CSS framework       | Tailwind CSS 4+       | Utility-first styling                                           |
| Package manager     | pnpm 10+ (standalone) | No Corepack dependency, `packageManager` field pinning          |
| Hosting             | Cloudflare Pages      | Project: `forestal-mt-store`                                    |
| Database            | Cloudflare D1         | `fmt-products-database`                                         |
| Object storage      | Cloudflare R2         | Bucket: `assets`                                                |
| CDN                 | Cloudflare            | `cdn.forestal-mt.com` (R2 custom domain)                        |
| Video               | Cloudflare Stream     | Hero videos only                                                |
| Sessions            | Cloudflare KV         | Namespace: `SESSION`                                            |
| External API        | Cloudflare Workers    | `fmt-ecommerce-api` (cart, orders, inventory — not yet active)  |
| Transactional email | Resend                | Outbound email from `@forestal-mt.com` addresses                |
| Phone validation    | libphonenumber-js     | Country-aware phone number validation in contact form           |
| DNS                 | Cloudflare            | Zone: `forestal-mt.com`                                         |
| E2E testing         | Playwright            | Functional testing, visual regression, accessibility (axe-core) |
| Performance testing | Lighthouse CI         | Automated scores, SEO audits, PR status checks                  |
| CI/CD               | GitHub Actions        | Lint, build, test, deploy                                       |
| Development         | Claude Code           | Full-stack development and operations                           |

### Astro Configuration

- **Minimum version:** Astro 5.7+ (required for experimental Fonts API)
- **Architecture:** Islands Architecture — static HTML shell with interactive components hydrated on demand
- **SSR adapter:** `@astrojs/cloudflare`
- **Trailing slash:** `trailingSlash: "always"`
- **Output:** `static` (all 64 pages generated at build time)

### Astro Integrations

| Integration           | Purpose                                                                           |
| --------------------- | --------------------------------------------------------------------------------- |
| `@astrojs/cloudflare` | SSR adapter for Cloudflare Pages Workers                                          |
| `@astrojs/preact`     | Preact islands for interactive components                                         |
| `@astrojs/sitemap`    | Automatic sitemap generation                                                      |
| `@astrojs/mdx`        | MDX processing — enables `components` prop on `<Content />` for element overrides |

### Content Collections & MDX

Page content files use **MDX (.mdx) with YAML frontmatter**. The content is pure Markdown (no JSX, no imports) — MDX is used to enable the `components` prop on `<Content />`.

`@astrojs/mdx` is installed to allow mapping standard HTML elements (h2, h3, a, blockquote, img) to custom Astro components for visual rendering. This is the bridge between editorial content and designed page sections.

```astro
<!-- Example: rendering body content with visual components -->
<Content
  components={{
    h2: SectionHeading,
    h3: ProductCard,
    blockquote: Callout,
    a: StyledLink,
  }}
/>
```

Content Collections glob pattern: `**/*.{md,mdx}` (supports both formats during transition).

---

## 2. Brand Voice

### Key Themes

| Theme                   | Description                                                                        |
| ----------------------- | ---------------------------------------------------------------------------------- |
| Origin authenticity     | Direct sourcing from La Mosquitia, Olancho, and highland Honduras — not a reseller |
| Ancestral knowledge     | Products rooted in Miskito, Garifuna, and mestizo ethnobotanical traditions        |
| Ethical sourcing        | Fair trade with indigenous and rural communities, long-term partnerships           |
| Traceability            | Every product traceable to origin community and harvesting method                  |
| Indigenous partnerships | Revenue-sharing and social responsibility with source communities                  |

### Tone

Professional yet warm. Heritage-focused. Transparency-driven. Globally positioned but grounded in Honduran identity. Storytelling with substance — no empty claims, every statement backed by sourcing reality.

---

## 3. Rendering Model

### Static (SSG) — Built at deploy time

The site uses `output: "static"` with one SSR exception. All 64 deployed HTML pages are generated at build time. Cloudflare Pages serves static HTML from CDN edge. The `@astrojs/cloudflare` adapter is active (required for the SSR API endpoint and `platformProxy` in local dev).

**Content pages (17 pages) — driven by MDX frontmatter:**

- Home, About, Wholesale, Contact
- 3 Catalogue pages (Batana Oil, Stingless Bee Honey, Traditional Herbs)
- Community + subpages (FAQs, Docs, Testimonials, Blog & Stories)
- Legal pages (Terms, Privacy, Disclaimer, Shipping)
- Utility pages (404)

**Product pages (47 pages) — driven by 6 JSON data files in `src/data/`:**

- Shop (`/products/`) — static listing generated from `products.json` + `pricing.json`
- 46 Product Detail Pages (`/products/{handler}/`) — static HTML generated per-product from `products.json`, `content.json`, `media.json`, `seo.json`, `pricing.json`, `inventory.json`

**Catalogue pages are informational and educational.** They describe what the products are, their origin, sourcing methods, traditional uses, and cultural significance. They do NOT display prices, stock levels, variant selectors, or any runtime data. They link to the Shop page and individual PDPs.

**Product data at build time:** `[handler].astro` imports all 6 JSON files from `src/data/` and statically generates one HTML page per product. Inventory and pricing in the static HTML reflect the JSON snapshot at deploy time.

### SSR API Endpoint

`src/pages/api/contact.ts` uses `export const prerender = false`, making it the sole SSR route in an otherwise fully static site. Astro adds `/api/*` to `_routes.json` include list at build time — these requests are routed through `_worker.js` instead of served as static files. All 64 HTML pages remain SSG.

| Endpoint       | Method | Handler                    | Purpose                            |
| -------------- | ------ | -------------------------- | ---------------------------------- |
| `/api/contact` | POST   | `src/pages/api/contact.ts` | Contact form submission via Resend |

The endpoint validates payload, maps the `sendTo` destination label to the correct `@forestal-mt.com` address (label-to-address mapping is server-side only — email addresses are never exposed to the client), and sends the message via Resend with `From: selected-address@forestal-mt.com` and `Reply-To: submitter email`. Returns `{ success: boolean }` JSON.

### E-Commerce Layer (client-side, not SSR)

Real-time product data (live inventory, prices, cart, orders) is handled by client-side Preact islands fetching from `fmt-ecommerce-api` Cloudflare Worker. The static HTML shell serves Google and delivers maximum TTFB performance; the API layer serves the customer at runtime. SSR is not required for PDPs. See `docs/architecture/pdp-ecommerce-architecture.md`.

### Future Scope (not yet built)

When implemented, these pages require `output: "hybrid"` with KV session gates:

- Customer account pages (`/account/*`)
- Admin pages (`/admin/*`)
- Cart, Checkout, Order Confirmation, Order Tracking
- Login, Register, Forgot/Reset Password

---

## 4. Shared Layout

### Header

Present on every page. Contains: logo, primary navigation, search box, cart icon, account icon. Sticky on scroll. Responsive — collapses to hamburger menu on mobile.

#### Search Box

Global search input in the header. Two complementary layers:

| Layer                  | Context        | Behavior                                          | Destination                 |
| ---------------------- | -------------- | ------------------------------------------------- | --------------------------- |
| **UX (autocomplete)**  | User on site   | Typeahead dropdown with matching products → click | PDP: `/products/{handler}/` |
| **SEO (SearchAction)** | User on Google | Google Sitelinks Search Box in SERP → submit      | Shop: `/products/?q={term}` |

**Requirement:** The Shop page (`/products/`) must handle `?q=` query param for product filtering. This is mandatory for Google Sitelinks Search Box to function. Currently the Shop is SSG — `?q=` filtering is handled client-side. When the Shop moves to SSR, filtering will be D1-powered server-side. If `/products/?q={term}` does not return filtered results, Google disables the Sitelinks Search Box.

### Footer

Present on every page. Contains: logo, navigation links, legal links, social media links, newsletter signup, copyright notice, company legal name (Forestal Murillo Tejada S. de R.L.).

### Breadcrumbs

Present on all pages except Home. Rendered as `BreadcrumbList` JSON-LD for SEO. Visual breadcrumb trail matches JSON-LD structure.

---

## 5. Asset Management

### Rule: One CDN for all images

**All images are stored in Cloudflare R2 and served from `cdn.forestal-mt.com`.** No images are stored in the Astro project's `public/` directory except the favicon.

### What lives in R2

| Asset Type             | R2 Path                                  | Dimensions | Source of Truth |
| ---------------------- | ---------------------------------------- | ---------- | --------------- |
| ProductGroup images    | `products/productGroup/{handler}.png`    | 1200x1200  | `media.json`    |
| Product OG images      | `products/og/{handler}.png`              | 1200x630   | `media.json`    |
| Product variant images | `products/variants/{handler}-{size}.png` | 1200x1200  | `media.json`    |
| Page hero images       | `pages/{page-slug}/hero.{ext}`           | Per design | R2 bucket       |
| Page content images    | `pages/{page-slug}/{image-name}.{ext}`   | Per design | R2 bucket       |
| Page OG images         | `pages/{page-slug}/og.jpg`               | 1200x630   | R2 bucket       |

### What lives in Astro `public/`

Only non-content, site-level files:

| File                          | Purpose                                                  |
| ----------------------------- | -------------------------------------------------------- |
| `favicon.ico` / `favicon.svg` | Browser tab icon                                         |
| Favicon PNGs + touch icons    | Various sizes for platforms (Android, Apple, MS, Yandex) |
| `robots.txt`                  | Crawler directives                                       |
| `manifest.webmanifest`        | PWA manifest                                             |
| `_headers`                    | Cloudflare Pages custom headers                          |
| `_redirects`                  | Cloudflare Pages redirect rules                          |
| `browserconfig.xml`           | Microsoft tile configuration                             |

**Not in `public/`:** Sitemap (`fmt-sitemap-index.xml`) is generated by `@astrojs/sitemap` into `dist/` at build time. Fonts are in `src/assets/fonts/` (processed by Astro). No content images — all served from R2 CDN.

### What lives in Cloudflare Stream

| Asset       | Pages                                                    | Count |
| ----------- | -------------------------------------------------------- | ----- |
| Hero videos | Home, Batana Oil, Stingless Bee Honey, Traditional Herbs | 4     |

Stream is used exclusively for hero videos on static pages. No product videos exist.

### Fonts

Fonts are self-hosted via Astro's experimental Fonts API (`experimental.fonts` in `astro.config.mjs`). Loaded through `fontProviders.local()` with `<Font />` component in the layout `<head>`. Source files are maintained in this suite (`fonts/`).

| Font Family       | CSS Variable     | Weights / Styles                     | Format | Role                                                               |
| ----------------- | ---------------- | ------------------------------------ | ------ | ------------------------------------------------------------------ |
| The New Elegance  | `--font-display` | Regular, Condensed Italic            | woff2  | Display — hero headlines (H1)                                      |
| Cinzel            | `--font-heading` | 400, 600, 700                        | woff2  | Display — section headings (H2+), eyebrow text                     |
| Libre Baskerville | `--font-body`    | 400 (normal + italic), 700           | woff2  | Editorial — paragraphs, descriptions, storytelling                 |
| Open Sans         | `--font-ui`      | 300, 400 (normal + italic), 600, 700 | woff2  | UI — menus, buttons, CTAs, labels, forms, tables, alerts, checkout |

### Typography Hierarchy

| Element                   | Font Family       | Weight     | CSS Variable     |
| ------------------------- | ----------------- | ---------- | ---------------- |
| Eyebrow text              | Cinzel            | 400        | `--font-heading` |
| H1 (hero headlines)       | The New Elegance  | 400        | `--font-display` |
| H2 (section headings)     | Cinzel            | 600        | `--font-heading` |
| H3–H6                     | Cinzel            | 400–600    | `--font-heading` |
| Body text (paragraphs)    | Libre Baskerville | 400        | `--font-body`    |
| Editorial italic          | Libre Baskerville | 400 italic | `--font-body`    |
| CTA buttons               | Open Sans         | 600        | `--font-ui`      |
| Navigation, labels, forms | Open Sans         | 400        | `--font-ui`      |
| Tables, alerts, microcopy | Open Sans         | 300–400    | `--font-ui`      |

**Open Sans is NOT a body font.** It handles UI elements, microcopy, and functional text only. Libre Baskerville is the body/editorial font for all readable content.

### Astro Fonts API

Fonts are configured via Astro's experimental Fonts API (available since Astro 5.7.0). This provides automatic preload links, optimized fallbacks, and performance-first font loading.

```js
// astro.config.mjs
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  experimental: {
    fonts: [
      {
        provider: fontProviders.local(),
        name: "The New Elegance",
        cssVariable: "--font-display",
        options: {
          variants: [
            /* ... */
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Cinzel",
        cssVariable: "--font-heading",
        options: {
          variants: [
            /* ... */
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Libre Baskerville",
        cssVariable: "--font-body",
        options: {
          variants: [
            /* ... */
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Open Sans",
        cssVariable: "--font-ui",
        options: {
          variants: [
            /* ... */
          ],
        },
      },
    ],
  },
});
```

Font source files are stored under `src/` (e.g. `src/assets/fonts/`) — never in `public/` (Astro would duplicate them). Astro automatically processes, optimizes, and caches fonts in `.astro/fonts/` (gitignored). The `<Font />` component is imported in the base layout `<head>`:

```astro
---
import { Font } from "astro:assets";
---

<Font cssVariable="--font-display" preload />
<Font cssVariable="--font-heading" preload />
<Font cssVariable="--font-body" preload />
<Font cssVariable="--font-ui" preload />
```

### Logos

Logos are served from the Astro project build (they are site-level brand assets, not content).

| File             | Dimensions | Description                                         |
| ---------------- | ---------- | --------------------------------------------------- |
| `logo.svg`       | Vector     | Primary — scalable master for all contexts          |
| `logo.png`       | 500x500    | Primary raster — green pines + text                 |
| `logo-gold.png`  | 2000x2000  | Gold/mustard variant for premium contexts           |
| `logo-dark.png`  | 686x714    | Black pines + black text — use on light backgrounds |
| `logo-light.png` | 686x714    | White pines + white text — use on dark backgrounds  |

---

## 6. URL Policy

### Trailing slash

All URLs end with `/`. No exceptions.

- Astro config: `trailingSlash: "always"`
- Requests without trailing slash → 301 redirect to trailing-slash version
- Canonical URLs in `<link rel="canonical">` and sitemaps always include trailing slash

### URL structure

| Pattern                 | Type                    | Example                               |
| ----------------------- | ----------------------- | ------------------------------------- |
| `/{page}/`              | Static page             | `/about/`, `/wholesale/`              |
| `/{catalogue}/`         | Catalogue page (static) | `/batana-oil/`, `/traditional-herbs/` |
| `/products/`            | Shop page (dynamic)     | —                                     |
| `/products/{handler}/`  | PDP (dynamic)           | `/products/raw-batana-oil/`           |
| `/community/{subpage}/` | Community subpage       | `/community/faqs/`                    |
| `/{legal-page}/`        | Legal page              | `/terms/`, `/privacy/`                |
| `/account/{section}/`   | Customer area           | `/account/orders/`                    |
| `/admin/{section}/`     | Admin area              | `/admin/products/`                    |

### Product URL derivation

Product URLs are derived from the `handler` field in `products.json`:

```
https://forestal-mt.com/products/{handler}/
```

The handler is the universal primary key across all 6 JSON files in this suite.

---

## 7. UI Design & Components

Summary:

- **UI Framework:** Preact via `@astrojs/preact` — interactive islands only, static Astro components by default
- **CSS:** Tailwind CSS 4+ with custom design tokens (forest green, gold, warm neutrals)
- **Island Strategy:** `client:load` for critical (cart, variant selector), `client:idle` for secondary (search, filters), `client:visible` for below-fold (accordions, zoom)
- **Design Tokens:** Color palette, spacing scale, breakpoints, shadows, z-index layers, border radius
- **Components:** Cards, accordions, modals/drawers, tabs, badges, loading skeletons, trust signals
- **E-Commerce:** Cart panel (right drawer), variant selector, price display, quantity selector
- **Responsive:** Mobile-first, WCAG 2.1 AA accessibility, 44px minimum touch targets

---

## 8. SEO & Structured Data

Full specification in **[`SEO_STRUCTURED_DATA_SPEC.md`](./SEO_STRUCTURED_DATA_SPEC.md)**.

Summary:

- **SEO:** Custom `<Head>` component (no third-party packages), meta tags from `seo.json`/frontmatter, OG/Twitter cards, canonical URLs with trailing slash, robots directives per page type
- **Sitemap:** `@astrojs/sitemap` auto-discovers all 63 indexable pages at build time — no custom endpoint needed
- **Structured Data:** JSON-LD with `@graph` pattern, schema.org vocabulary, E-E-A-T signals, Zod validation at build time
- **Validation:** Lighthouse CI in pipeline, Google Rich Results Test, Schema Markup Validator

---

## 9. Data Flow Rules

### Product data (current — SSG)

```
6 JSON files (forestal-mt-suite) → imported by Astro at build time → static HTML (Shop + 46 PDPs)
6 JSON files (forestal-mt-suite) → seed → D1 → queried by fmt-ecommerce-api Worker (not yet active)
```

- At build time, `[handler].astro` imports all 6 JSON files directly from `src/data/`
- D1 (`fmt-products-database`) exists and is seeded from the JSON suite — it is the future runtime source for the `fmt-ecommerce-api` Worker, not for the Astro build
- The 6 JSON files in the `forestal-mt-suite` repo are the canonical source of truth
- If D1 and the JSON suite disagree, the JSON suite is correct — re-seed D1

**JSON files imported at build time:**

| File             | Contents                                                    |
| ---------------- | ----------------------------------------------------------- |
| `products.json`  | Product name, handler, variants, catalog assignment         |
| `content.json`   | Descriptions, how-to-use steps, processing method, specs    |
| `media.json`     | Image URLs, alt text, captions for ProductGroup + variants  |
| `seo.json`       | SEO title, meta description, OG data per product            |
| `pricing.json`   | Variant prices (USD)                                        |
| `inventory.json` | Availability status, stock levels (snapshot at deploy time) |

### Images

```
R2 bucket (assets) → cdn.forestal-mt.com → referenced in static HTML and OG tags
```

- Product image URLs are defined in `media.json`
- Page OG images: `cdn.forestal-mt.com/pages/{slug}/og.jpg`
- Page hero images: `cdn.forestal-mt.com/pages/{slug}/hero.jpg`

---

## 10. Email Infrastructure

### Outbound — Resend

Transactional email is handled by Resend. Domain `forestal-mt.com` is verified with full authentication.

| Setting         | Value                                                            |
| --------------- | ---------------------------------------------------------------- |
| SDK             | `resend` npm package (workspace root)                            |
| API key env var | `RESEND_API_KEY` — stored in CF Pages env + GH Actions secret    |
| From addresses  | `sales@`, `support@`, `admin@forestal-mt.com`                    |
| Return-path     | `send.forestal-mt.com` → `feedback-smtp.us-east-1.amazonses.com` |
| Account         | forestalmt.hn@gmail.com                                          |

DNS records added for Resend:

| Type | Name                | Value                                          |
| ---- | ------------------- | ---------------------------------------------- |
| TXT  | `resend._domainkey` | Resend DKIM key                                |
| MX   | `send`              | `feedback-smtp.us-east-1.amazonses.com` (p=10) |
| TXT  | `send`              | `v=spf1 include:amazonses.com ~all`            |

Root SPF updated to include amazonses.com: `v=spf1 include:_spf.mx.cloudflare.net include:amazonses.com include:_spf.google.com ~all`

### Inbound — Cloudflare Email Routing

`admin@`, `sales@`, and `support@forestal-mt.com` are active inbound addresses. All three forward to `forestalmt.hn@gmail.com`. Gmail "Send mail as" is configured for all three addresses via `smtp.resend.com:465` (SSL) — Nery can compose and reply as any `@forestal-mt.com` address from Gmail.

### Contact Form

The contact form (`/contact/`) is handled by `ContactFormIsland.tsx` (Preact, `client:visible`). Form fields: First Name, Last Name, Company (optional), Email, Country (drives phone dial code), Phone (validated per-country via `libphonenumber-js`), Subject (optional), Send To (maps to sales/support/admin — labels only, addresses never exposed), Message. States: idle, submitting, success, error. Submits to `POST /api/contact`.

Country and dial-code data lives in `src/data/countries.ts`: exports `COUNTRIES` array (full list with ISO codes, dial codes, phone placeholders) and `PRIORITY_COUNTRY_CODES` (16 priority markets pinned at top of selector).

---

## 11. Performance Targets

| Metric                          | Target  | Tool            |
| ------------------------------- | ------- | --------------- |
| Lighthouse Performance          | >= 90   | Lighthouse CI   |
| Lighthouse SEO                  | >= 95   | Lighthouse CI   |
| Largest Contentful Paint (LCP)  | < 2.5s  | Core Web Vitals |
| Cumulative Layout Shift (CLS)   | < 0.1   | Core Web Vitals |
| Interaction to Next Paint (INP) | < 200ms | Core Web Vitals |
| Time to First Byte (TTFB)       | < 800ms | WebPageTest     |

---

## 12. Package Manager

### pnpm (standalone)

pnpm is the sole package manager. Installed as a standalone binary (`@pnpm/exe`) — does not depend on Node.js to run. Corepack is not used (being removed from Node.js 25+).

| Setting                 | Value                                                     |
| ----------------------- | --------------------------------------------------------- |
| Installation method     | Standalone binary (ELF, `@pnpm/exe`)                      |
| Version pinning         | `"packageManager": "pnpm@{version}"` in `package.json`    |
| Auto-version management | `manage-package-manager-versions: true` (pnpm 10 default) |
| Lockfile format         | `pnpm-lock.yaml` v9.0                                     |
| Store                   | Content-addressable, shared across projects               |
| CI install command      | `pnpm install --frozen-lockfile`                          |

### CI setup

```yaml
- uses: pnpm/action-setup@v4
  with:
    version: 10

- uses: actions/setup-node@v4
  with:
    node-version: 24
    cache: "pnpm"

- run: pnpm install --frozen-lockfile
```

`standalone: true` is NOT needed in GitHub Actions (Node.js is always available via `actions/setup-node`). Cache via `actions/setup-node` with `cache: 'pnpm'` is sufficient.

---

## 13. CI/CD Pipeline

### GitHub Actions

Cloudflare Pages auto-deploy is **disabled**. GH Actions `wrangler pages deploy` (Direct Upload) is the sole deploy path. All quality gates must pass before production deployment.

| Stage                    | Trigger        | Actions                                                               |
| ------------------------ | -------------- | --------------------------------------------------------------------- |
| **1. Lint**              | Push, PR       | ESLint (with jsx-a11y for islands), Prettier, Astro check             |
| **2. Build**             | Push, PR       | `astro build` — validates SSG pages, uploads Sentry source maps       |
| **3. E2E Tests**         | Push, PR       | Playwright against local build — 17 pages, axe-core a11y on all       |
| **4. Lighthouse**        | Push, PR       | Lighthouse CI against localhost (1 run, 8 URLs, desktop preset)       |
| **5. Deploy**            | Push to `main` | `pnpm exec wrangler pages deploy` — only runs if stages 1-4 pass      |
| **6. Lighthouse (Prod)** | Push to `main` | Lighthouse CI against production URLs (continue-on-error, monitoring) |

### Playwright (E2E Testing)

Functional end-to-end testing via `@playwright/test`. Validates that pages render, structured data is present, and interactive islands behave correctly.

| Capability        | Details                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Framework         | `@playwright/test`                                                            |
| Accessibility     | `@axe-core/playwright` (WCAG 2.1 AA)                                          |
| CDP integration   | Native `CDPSession` API — performance metrics, network emulation, JS coverage |
| Visual regression | Screenshot comparison with `toHaveScreenshot()`                               |
| Browsers          | Chromium (CI), Firefox + WebKit (local)                                       |
| CI testing        | Tests run against localhost build via `PLAYWRIGHT_BASE_URL`                   |
| Hydration         | Wait for Astro island hydration before interacting with Preact components     |

**CDP (Chrome DevTools Protocol)** is built into Playwright — no separate plugin. Provides `Performance.getMetrics`, network condition emulation (slow 3G), JavaScript coverage analysis, and HAR recording. Only works with Chromium.

**Testing product pages:** E2E tests run against a local static server (`serve@14`) serving the built `dist/`. For local development with CF bindings, `pnpm preview` runs `wrangler pages dev`. When SSR is activated for future pages, D1/KV bindings will be available via `platformProxy`.

### Lighthouse CI

Two Lighthouse configurations:

| Config                        | Target     | Runs | Gate?                | URLs |
| ----------------------------- | ---------- | ---- | -------------------- | ---- |
| `lighthouserc.cjs`            | localhost  | 1    | Yes — blocks deploy  | 8    |
| `lighthouserc.production.cjs` | production | 1    | No — monitoring only | 8    |

GitHub App integration posts score comments on PRs. Production Lighthouse runs post-deploy with `continue-on-error: true`.

**Playwright and Lighthouse CI are complementary:**

- **Lighthouse CI** = quality gate for aggregate scores (performance, SEO, accessibility, best practices)
- **Playwright** = functional validation (pages render, interactions work, structured data present, a11y passes)

### Deploy Flow

```
Push to main → Lint → Build → E2E (17 pages) → Lighthouse (localhost)
                                                       │
                                                  All pass?
                                                       │
                                              YES ─────┴───── NO → Pipeline fails, no deploy
                                                       │
                                              pnpm exec wrangler pages deploy
                                                       │
                                              forestal-mt.com updated
                                                       │
                                              Lighthouse (production) ← monitoring, never blocks

PR to main → Same stages 1-4 run. No deploy. No preview deploys.
```

CF Pages auto-deploy and preview deploys are **disabled**. All deploys go through GH Actions quality gates.

---

## 14. Development Model

### Claude Code Integration

Claude Code is the sole development tool for all Forestal MT web projects. No external developers, agencies, or freelancers.

| Layer        | Claude Code Role                                       |
| ------------ | ------------------------------------------------------ |
| Architecture | System design, technology decisions, rendering model   |
| Frontend     | Astro components, layouts, pages, islands              |
| Backend      | D1 queries, KV sessions, Workers, R2 operations        |
| Data         | 6-file JSON suite management, D1 seeding, cross-audits |
| SEO          | Structured data, meta tags, OG images, sitemap, schema |
| CI/CD        | GitHub Actions workflows, Lighthouse CI, deployment    |
| Operations   | DNS, CDN, R2 bucket management, Stream configuration   |

### Canonical Authority

The `forestal-mt-suite` repository is the single source of truth for all product data. Any downstream system (Astro project, D1 database, API Worker) must conform to what is defined in the suite. Conflicts are resolved by re-seeding from the suite.

---

_Forestal Murillo Tejada S. de R.L. - Forestal MT_
