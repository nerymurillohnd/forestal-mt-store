# Forestal MT — Site Technical Specification

**Document version:** 2.1
**Last updated:** 2026-02-17
**Language:** English
**Applies to:** forestal-mt.com and all related Forestal MT web projects

---

## 1. Stack

| Layer               | Technology            | Service                                                         |
| ------------------- | --------------------- | --------------------------------------------------------------- |
| Framework           | Astro 5.7+            | SSG + SSR hybrid, Islands Architecture                          |
| UI framework        | Preact                | Interactive islands, React-compatible API (3KB)                 |
| CSS framework       | Tailwind CSS 4+       | Utility-first styling                                           |
| Package manager     | pnpm 10+ (standalone) | No Corepack dependency, `packageManager` field pinning          |
| Hosting             | Cloudflare Pages      | Project: `forestal-mt-store`                                    |
| Database            | Cloudflare D1         | `fmt-products-database`                                         |
| Object storage      | Cloudflare R2         | Bucket: `assets`                                                |
| CDN                 | Cloudflare            | `cdn.forestal-mt.com` (R2 custom domain)                        |
| Video               | Cloudflare Stream     | Hero videos only                                                |
| Sessions            | Cloudflare KV         | Namespace: `SESSION`                                            |
| External API        | Cloudflare Workers    | `api-worker` (wholesale/third-party)                            |
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
- **Output:** `hybrid` (static by default, opt-in SSR per page)

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

Pages with fixed content that does not depend on D1 or any runtime data source. Rebuilt only on deploy.

- Home, About, Wholesale, Contact
- 3 Catalogue pages (Batana Oil, Stingless Bee Honey, Traditional Herbs)
- Community + subpages (FAQs, Docs, Testimonials, Blog & Stories)
- Legal pages (Terms, Privacy, Disclaimer, Shipping)
- Utility pages (404, Login, Register, Forgot/Reset Password)

**Catalogue pages are informational and educational.** They describe what the products are, their origin, sourcing methods, traditional uses, and cultural significance. They do NOT display prices, stock levels, variant selectors, or any data from D1. They link to the Shop page and individual PDPs where dynamic product data lives.

### Dynamic (SSR) — Server-rendered per request

Pages that query D1 and/or require runtime state. Rendered on Cloudflare Pages Workers via Astro SSR adapter.

- Shop (`/products/`) — product listing with prices, filters, availability from D1
- 46 Product Detail Pages (`/products/{handler}/`) — full PDP with pricing, variants, inventory, content from D1; images from R2
- E-commerce pages (Cart, Checkout, Order Confirmation, Order Tracking)

### Authenticated — SSR with session gate

Pages requiring valid session (KV-backed). Redirect to `/login/` if unauthenticated.

- Customer account pages (`/account/*`)
- Admin pages (`/admin/*`)

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

**Requirement:** The Shop page (`/products/`) must implement `?q=` query param to filter products server-side (D1 query). This is mandatory for Google Sitelinks Search Box to function. If `/products/?q={term}` does not return filtered results, Google disables the Sitelinks Search Box.

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
| Page OG images         | `pages/og/{page-slug}.png`               | 1200x630   | R2 bucket       |

### What lives in Astro `public/`

Only non-content, site-level files:

| File                          | Purpose                     |
| ----------------------------- | --------------------------- |
| `favicon.ico` / `favicon.svg` | Browser tab icon            |
| `robots.txt`                  | Crawler directives          |
| `sitemap.xml`                 | Generated by Astro at build |

Nothing else. No images, no fonts served from `public/`.

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

Full specification in **[`UI_DESIGN_SPEC.md`](./UI_DESIGN_SPEC.md)**.

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
- **Sitemap:** `@astrojs/sitemap` for static pages + custom `sitemap.xml.ts` endpoint for SSR routes (D1 query)
- **Structured Data:** JSON-LD with `@graph` pattern, schema.org vocabulary, E-E-A-T signals, Zod validation at build time
- **Validation:** Lighthouse CI in pipeline, Google Rich Results Test, Schema Markup Validator

---

## 9. Data Flow Rules

### Product data

```
6 JSON files (this suite) → seed → D1 → queried by Astro SSR (PDPs/Shop)
                                       → queried by API Worker (wholesale)
```

- D1 is the runtime source for all product data on the site
- The 6 JSON files in this suite are the canonical source; D1 is seeded from them
- If D1 and the JSON suite disagree, the JSON suite is correct — re-seed D1

### Images

```
R2 bucket (assets) → cdn.forestal-mt.com → referenced by SSR pages and OG tags
```

- Product image URLs are defined in `media.json`
- Page image URLs follow the R2 path convention in section 3

### No product data in the Astro project

The Astro project contains zero product data:

- No JSON imports of product data
- No Content Collections for products
- No MDX files for products
- No product images in `public/`
- No hardcoded prices, names, or descriptions

All product information flows from D1 at request time.

---

## 10. Performance Targets

| Metric                          | Target  | Tool            |
| ------------------------------- | ------- | --------------- |
| Lighthouse Performance          | >= 90   | Lighthouse CI   |
| Lighthouse SEO                  | >= 95   | Lighthouse CI   |
| Largest Contentful Paint (LCP)  | < 2.5s  | Core Web Vitals |
| Cumulative Layout Shift (CLS)   | < 0.1   | Core Web Vitals |
| Interaction to Next Paint (INP) | < 200ms | Core Web Vitals |
| Time to First Byte (TTFB)       | < 800ms | WebPageTest     |

---

## 11. Package Manager

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
    node-version: 22
    cache: "pnpm"

- run: pnpm install --frozen-lockfile
```

`standalone: true` is NOT needed in GitHub Actions (Node.js is always available via `actions/setup-node`). Cache via `actions/setup-node` with `cache: 'pnpm'` is sufficient.

---

## 12. CI/CD Pipeline

### GitHub Actions

| Stage           | Trigger        | Actions                                                |
| --------------- | -------------- | ------------------------------------------------------ |
| **Lint**        | Push, PR       | ESLint, Prettier, Astro check                          |
| **Build**       | Push, PR       | `astro build` — validates SSG pages, checks types      |
| **E2E Tests**   | Push, PR       | Playwright against local build (Chromium)              |
| **E2E Preview** | PR only        | Playwright against Cloudflare Pages preview deployment |
| **Lighthouse**  | Push, PR       | Lighthouse CI (performance >= 90, SEO >= 95)           |
| **Deploy**      | Push to `main` | Cloudflare Pages deployment via `wrangler`             |

### Playwright (E2E Testing)

Functional end-to-end testing via `@playwright/test`. Validates that pages render, forms work, SSR routes return correct data, and structured data is present.

| Capability        | Details                                                                       |
| ----------------- | ----------------------------------------------------------------------------- |
| Framework         | `@playwright/test`                                                            |
| Accessibility     | `@axe-core/playwright` (WCAG 2.1 AA)                                          |
| CDP integration   | Native `CDPSession` API — performance metrics, network emulation, JS coverage |
| Visual regression | Screenshot comparison with `toHaveScreenshot()`                               |
| Browsers          | Chromium (CI), Firefox + WebKit (local)                                       |
| Preview testing   | Tests run against Cloudflare Pages preview URLs via `PLAYWRIGHT_BASE_URL`     |
| Hydration         | Wait for Astro island hydration before interacting with Preact components     |

**CDP (Chrome DevTools Protocol)** is built into Playwright — no separate plugin. Provides `Performance.getMetrics`, network condition emulation (slow 3G), JavaScript coverage analysis, and HAR recording. Only works with Chromium.

**Testing SSR routes:** Tests run against Cloudflare Pages preview deployments (real D1, real R2, real KV). For local development, `pnpm preview` runs `wrangler pages dev` with local bindings via `platformProxy`.

### Lighthouse CI

Automated performance and SEO audits on every PR via `@lhci/cli`. Scores below threshold block merge. GitHub App integration posts score comments on PRs.

**Playwright and Lighthouse CI are complementary:**

- **Lighthouse CI** = quality gate for aggregate scores (performance, SEO, accessibility, best practices)
- **Playwright** = functional validation (pages render, interactions work, SSR returns data, visual regressions detected)

### Deploy Flow

```
Push to main → GitHub Actions → Lint → Build → E2E Tests → Lighthouse → Deploy
                                                                          ↓
                                                                forestal-mt.com

PR → Build → Deploy Preview → E2E against preview URL
                             → Lighthouse against preview URL
```

Preview deployments on PRs via Cloudflare Pages branch previews. Playwright and Lighthouse run against the preview URL to validate before merge.

---

## 13. Development Model

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
