# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Astro 5.7+ e-commerce site for forestal-mt.com. Deployed on Cloudflare Pages. This is a **clean rebuild** from finalized specifications. All architectural decisions are made — follow the specs, don't improvise.

## Canonical Source

The `forestal-mt-suite` repository (`~/projects/forestal-mt-suite/`) is the **single source of truth** for all data, content, schemas, assets, and specifications. This project CONSUMES files from the suite — it never modifies them.

Copies of the main spec docs live in this repo root for quick reference:

- `SEO_STRUCTURED_DATA_SPEC.md` — JSON-LD architecture, schema.org types, meta tags
- `SITE_TECHNICAL_SPEC.md` — Full stack, rendering model, fonts, CI/CD
- `SITE_URL_MANIFEST.md` — Complete URL inventory (64 pages, 63 indexable)

---

## Workspace

This repo is a pnpm workspace with two packages:

| Package             | Directory     | Deployment                                                     |
| ------------------- | ------------- | -------------------------------------------------------------- |
| `forestal-mt-store` | `/` (root)    | Cloudflare Pages — deploys via GH Actions after all gates pass |
| `fmt-ecommerce-api` | `api-worker/` | Cloudflare Worker — manual (`pnpm deploy:prod` or GH Actions)  |

Shared lockfile (`pnpm-lock.yaml`) at root. Both packages have their own `CLAUDE.md`.

**Claude Code session model:** Start Claude from the directory matching your task:

- Astro pages, content, components, SEO → start from `forestal-mt-store/` (here)
- API routes, D1 schema, Hono handlers, DHL → start from `forestal-mt-store/api-worker/`

**HARD RULE — API Worker session boundary:**
If Nery requests, or the task requires, any of the following while in a session started from this root directory:
implementing Hono routes, modifying `api-worker/src/`, editing `schema.ts`, running D1 migrations, integrating DHL, or any substantive `api-worker/` development —
**STOP immediately. Do not execute. Say explicitly:**

> "This must be done from a session started in `api-worker/`. Open a new terminal, `cd api-worker/`, and start Claude Code from there."
> The only exceptions allowed from root: editing `api-worker/package.json`, `api-worker/wrangler.toml`, or `api-worker/CLAUDE.md` when the change is a one-liner with no architectural decisions involved.

**Cross-workspace commands (run from root without cd):**

```bash
pnpm --filter api-worker dev         # wrangler dev for the Worker
pnpm --filter api-worker deploy:prod # deploy Worker to production
```

---

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (kills port 4321 first, no CF bindings)
pnpm build            # Production build — run after every significant change
pnpm preview          # Preview with wrangler --remote (local Cloudflare bindings)
pnpm check            # Astro TypeScript type checking
pnpm lint             # ESLint — runs in CI, must pass before push
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier write
pnpm format:check     # Prettier check (CI)
pnpm test:e2e         # Playwright end-to-end tests
pnpm test:e2e:ui      # Playwright with interactive UI
pnpm lighthouse       # Lighthouse CI audit (localhost, requires built dist/)
pnpm lighthouse:prod  # Lighthouse CI audit (production URLs)
```

**CI gates (6 stages):** Lint (ESLint + Prettier + Astro check) → Build → E2E (17 pages) → Lighthouse (localhost) → Deploy (`wrangler pages deploy`) → Lighthouse (production, monitoring only). Any failure in stages 1-4 blocks deploy. CF Pages auto-deploy is **disabled** — GH Actions is the sole deploy path.

**Local quality protocol (Husky enforced):**

- Pre-commit: `pnpm format` + `git add -u` (auto-stages reformatted files)
- Pre-push: `pnpm lint && pnpm check` (ESLint + TypeScript)
- PostToolUse hook: Prettier auto-runs on every file write (`.claude/settings.json`)

---

## Stack

| Layer           | Technology            | Key Detail                                                                  |
| --------------- | --------------------- | --------------------------------------------------------------------------- |
| Framework       | Astro 5.7+            | Islands Architecture, `static` output mode                                  |
| Content         | MDX                   | `@astrojs/mdx` — component imports in content files                         |
| UI framework    | Preact                | `@astrojs/preact` — interactive islands only                                |
| CSS             | Tailwind CSS 4+       | `@tailwindcss/vite` plugin (NOT `@astrojs/tailwind`, NOT PostCSS)           |
| SSR adapter     | `@astrojs/cloudflare` | `platformProxy: { enabled: true }` for local D1/KV/R2                       |
| Package manager | pnpm 10+ standalone   | `"packageManager": "pnpm@10.29.3"` in package.json                          |
| Hosting         | Cloudflare Pages      | Project: `forestal-mt-store`, deploy gated by GH Actions CI                 |
| Database        | Cloudflare D1         | Binding: `DB` → `fmt-products-database` (pending — SSR not yet enabled)     |
| Object storage  | Cloudflare R2         | Binding: `R2` → `assets` bucket, CDN: `cdn.forestal-mt.com`                 |
| Sessions        | Cloudflare KV         | Binding: `SESSION` → namespace `SESSION` (pending)                          |
| Icons           | astro-icon            | `@iconify-json/fa6-brands` (social), `@iconify-json/logos` (payment brands) |
| Observability   | Sentry                | `@sentry/astro` (client) + `@sentry/cloudflare` (server)                    |

### Tailwind CSS 4 Setup

No `tailwind.config.mjs`, no PostCSS. Config via `@tailwindcss/vite` plugin. Design tokens in `src/styles/global.css` using `@theme` directive.

---

## Architecture

### Rendering Model

| Type               | Pages                                                                          | Data Source                         |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------- |
| **SSG — content**  | Home, About, Contact, Wholesale, 3 Catalogs, Community hub + 4 subpages, Legal | Content Collections (`pages/*.mdx`) |
| **SSG — products** | Shop (`/products/`), 46 PDPs (`/products/{handler}/`)                          | 6 JSON files in `src/data/`         |
| **Future scope**   | Account, Admin, Cart, Checkout, Auth pages                                     | SSR + D1 + KV — not yet built       |

### Content Collections

Schema defined in `src/content.config.ts`. Glob loader: `src/content/pages/**/*.{md,mdx}`.

**Critical gotcha:** Astro's glob loader uses the frontmatter `slug` field as the collection entry ID. Query with the slug value, not the filename:

```ts
// slug: community/faqs  → getEntry("pages", "community/faqs")
// slug: /               → getEntry("pages", "/")
const page = await getEntry("pages", "community/faqs");
```

Every page file requires: `slug`, `pageName`, `canonicalUrl`, `title`, `description`, `og`, `twitter`, `schemas`, `hero`.

### JSON-LD Schema Builder (`src/lib/jsonld.ts`)

`buildPageGraph(schemas, pageData)` resolves schema refs from page frontmatter into a `@graph` array. The switch in `resolveSchema()` handles these types:

| Frontmatter `type`                                                         | Produces                                                                                        |
| -------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `Organization`, `Brand`                                                    | Full or compact stub (via `mode: compact`)                                                      |
| `WebSite`, `SearchAction`                                                  | Global site schemas                                                                             |
| `VideoObject`                                                              | Matched by `@id` from stream-videos lookup                                                      |
| `BreadcrumbList`                                                           | Auto-built from `pageName` + `canonicalUrl` — detects community subpages for 3-level breadcrumb |
| `ImageObject`                                                              | Built from `og.image` data                                                                      |
| `AboutPage`, `Blog`, `CollectionPage`, `ContactPage`, `FAQPage`, `WebPage` | WebPage node variants                                                                           |
| `OfferCatalog`, `Service`                                                  | Extracted from OnlineStore.json / Service-wholesale.json                                        |

Unknown types silently return null (no crash). Add new cases to the switch when new page types need schema support.

### Hero Component (`src/components/Hero.astro`)

Data-driven from frontmatter `hero.*`. Three background modes:

- `background.type: "video"` → HLS via hls.js from Cloudflare Stream
- `background.type: "image"` → `<img>` from R2 CDN
- No `background` field (omit entirely) → dark gradient only — used for community subpages and legal pages

Video UIDs in `src/data/stream-videos.ts`. Hero images: 1920×1080 (16:9). Hero videos: 3200×1792.

### Breadcrumb Component

Accepts `pageName` and optional `parent?: { name: string; href: string }` for 3-level breadcrumbs:

```astro
<!-- Top-level page -->
<Breadcrumb pageName={data.pageName} />

<!-- Community subpage (3 levels: Home → Community → Page) -->
<Breadcrumb pageName={data.pageName} parent={{ name: "Community", href: "/community/" }} />
```

### Preact Islands (`src/components/islands/`)

Interactive components hydrated on demand. All islands use Preact (not React).

| Island                   | Directive        | Purpose                    |
| ------------------------ | ---------------- | -------------------------- |
| `AccordionIsland.tsx`    | `client:visible` | Collapsible content panels |
| `CountUpIsland.tsx`      | `client:visible` | Animated number counters   |
| `HerbScrollIsland.tsx`   | `client:visible` | Herbs scrolling list       |
| `ImpactBarIsland.tsx`    | `client:visible` | Animated metric bars       |
| `OriginPulseIsland.tsx`  | `client:visible` | Map/pulse animation        |
| `ScrollRevealIsland.tsx` | `client:visible` | Scroll-triggered reveals   |
| `TabSwitcherIsland.tsx`  | `client:idle`    | Tabbed content switcher    |

---

## CSS Utility Classes

Defined in `src/styles/global.css`. These are the primary layout and surface patterns — use them consistently:

| Class                | Effect                                                                             |
| -------------------- | ---------------------------------------------------------------------------------- |
| `.surface-warm`      | Warm off-white background                                                          |
| `.surface-parchment` | Parchment background (`#F5F0E8`)                                                   |
| `.surface-dark`      | Charcoal background (`#1A1A1A`) with light text                                    |
| `.grain`             | Noise texture overlay via `::before` pseudo-element (add to `relative` containers) |
| `.gold-rule`         | Centered gold horizontal rule (decorative `<hr>`)                                  |
| `.gold-rule-left`    | Left-aligned gold rule                                                             |
| `.stagger-children`  | CSS animation: child elements fade-in with sequential delay (up to 6 children)     |
| `.reveal-on-scroll`  | JS-driven scroll reveal — becomes visible when `.is-visible` is toggled            |
| `.card-hover`        | White card with lift shadow + border transition on hover                           |

### Design Tokens (Tailwind CSS variables)

<!-- prettier-ignore -->
```
--color-leaf-green: #206D03   /* primary CTA, links */
--color-grass-green: #54B006  /* hover state */
--color-gold: #F3C00D         /* accents, borders, rules */
--color-gold-dark: #A18500    /* eyebrow text */
--color-graphite: #333333     /* body text */
--color-charcoal: #1A1A1A     /* dark surfaces, headings */
--color-parchment: #F5F0E8    /* light section backgrounds */
```

### Font Variables

```css
--font-display   /* The New Elegance — Hero H1 */
--font-heading   /* Cinzel — Section headings, eyebrow text, nav */
--font-body      /* Libre Baskerville — Editorial body text */
--font-ui        /* Open Sans — Buttons, labels, UI elements */
```

Usage pattern: `font-[family-name:var(--font-heading)]` in Tailwind class strings.

---

## Images

All images served from R2 via `cdn.forestal-mt.com`. The ONLY images in `public/` are favicons.

- Product images: `cdn.forestal-mt.com/products/{type}/{handler}.png`
- Page hero images: `cdn.forestal-mt.com/pages/{slug}/hero.jpg`
- Page OG images: `cdn.forestal-mt.com/pages/{slug}/og.jpg`

**Cloudflare Image Resizing** is active. Use `/cdn-cgi/image/width=X,format=webp/{full-url}` for optimized sizes.

**Never use Astro's `<Image>` component for R2 URLs** — `passthroughImageService()` is configured, Sharp is disabled. Use plain `<img>` tags.

### R2 Asset Isolation Rule

Every page uses **only its own R2 folder**. A page at `/wholesale/` may only reference images under `pages/wholesale/`. Cross-folder references are forbidden — they create orphan dependencies and make audits impossible.

**The only exception:** catalog collection card images (preview cards linking to Batana Oil, Stingless Bee Honey, and Traditional Herbs) pull their hero/card image from `products/{ProductGroup}/` — the same ProductGroup image used in the PDP. This is intentional and the only allowed cross-folder reference.

If an image does not exist in the page's own R2 folder, the correct fix is to **upload the correct asset to that folder** — never borrow from another page's folder.

---

## Live Pages (64 deployed — 63 indexable)

**Content pages (17):**

| URL                        | Page                        |
| -------------------------- | --------------------------- |
| `/`                        | Home                        |
| `/about/`                  | About                       |
| `/batana-oil/`             | Batana Oil catalog          |
| `/stingless-bee-honey/`    | Stingless Bee Honey catalog |
| `/traditional-herbs/`      | Traditional Herbs catalog   |
| `/contact/`                | Contact                     |
| `/wholesale/`              | Wholesale Program           |
| `/community/`              | Community hub               |
| `/community/faqs/`         | FAQs                        |
| `/community/blog/`         | Blog & Stories              |
| `/community/testimonials/` | Testimonials                |
| `/community/docs/`         | Documentation               |
| `/terms/`                  | Terms & Conditions          |
| `/privacy/`                | Privacy Policy              |
| `/disclaimer/`             | Disclaimer                  |
| `/shipping/`               | Shipping & Returns          |
| `/404`                     | 404 Not Found (noindex)     |

**Product pages (47):** Shop (`/products/`) + 46 PDPs (`/products/{handler}/`) — each generated at build time from 6 JSON files in `src/data/`. Full product URL list: `SITE_URL_MANIFEST.md`.

**Future scope (not yet built):** Auth pages, Cart, Checkout, Account, Admin.

---

## Pending: E-Commerce Activation

**Full architecture spec:** `docs/architecture/pdp-ecommerce-architecture.md`

The PDPs currently display static inventory/pricing from JSON files. Before activating the cart,
these blocks must be replaced with Preact islands that fetch live data from `fmt-ecommerce-api`.
**Do NOT switch to `output: "hybrid"` for PDPs** — SSG shell + client-side API is the correct model.

### Required before cart launch

- [ ] Replace static availability + price block in `src/pages/products/[handler].astro` with `ProductAvailabilityIsland`
- [ ] Build API Worker endpoints: `GET /api/products/{handler}/availability`, `POST /api/cart`, `GET /api/cart`, `POST /api/orders`
- [ ] Integrate DHL Express API in `fmt-ecommerce-api`: shipment creation, AWB generation, rates, tracking
- [ ] Store AWB PDFs in R2 (`awbs/` prefix)
- [ ] Add `api.forestal-mt.com` DNS A/CNAME record → `fmt-ecommerce-api` Worker route
- [ ] Bind KV `SESSION` in Cloudflare Pages dashboard (prod + preview)
- [ ] Add Worker secrets: `DHL_API_KEY`, `DHL_ACCOUNT_NUMBER`
- [ ] Implement CORS on API Worker (allow `forestal-mt.com` origin)

### DHL Express API

DHL Express handles all shipping: shipment creation, Air Waybill (AWB) generation, label printing,
real-time tracking, and delivery confirmation. Integration lives entirely in `fmt-ecommerce-api` —
called at order confirmation. Shipper origin: Honduras (`countryCode: "HN"`), DAP incoterms.

---

## SSR Migration Checklist

When switching from `output: "static"` to `"hybrid"` for D1 product pages:

1. Uncomment `Sentry.d1Integration(context.env.DB)` in `functions/_middleware.js`
2. Uncomment D1/KV bindings in `wrangler.toml`
3. Bind D1/KV in Cloudflare Pages dashboard (prod + preview)
4. Change `output: "static"` → `"hybrid"` in `astro.config.mjs`
5. Verify `nodejs_compat` flag active in CF Pages dashboard
6. Test with `pnpm preview` (wrangler + local bindings)

---

## Sentry

Two-package split — mandatory for Cloudflare Pages:

| Layer               | Package                | File                       |
| ------------------- | ---------------------- | -------------------------- |
| Client (browser)    | `@sentry/astro`        | `sentry.client.config.js`  |
| Server (CF Workers) | `@sentry/cloudflare`   | `functions/_middleware.js` |
| Build (source maps) | `@sentry/astro` plugin | `astro.config.mjs`         |

Do NOT use `@sentry/node` — incompatible with CF Workers V8 isolates.

---

## Analytics

**Cloudflare Zaraz** manages all analytics. Tool: `XLZY` (Google Analytics 4).

- Measurement ID: `G-FHNE3TBXMW` (Property: Forestal MT, Account: Nery Samuel Murillo)
- `autoInjectScript: true` — Zaraz injects the GA4 beacon automatically

**DO NOT** add manual `<script>` GA4 tags in `Head.astro` or anywhere in code — Zaraz handles this.
Zaraz also handles the `stats.g.doubleclick.net` connection (required in CSP `connect-src`).

---

## URL Policy

All URLs end with `/`. Enforced via `trailingSlash: "always"`. No exceptions.

---

## Cloudflare Bindings

| Binding   | Type      | Name                    | Runtime Access               |
| --------- | --------- | ----------------------- | ---------------------------- |
| `DB`      | D1        | `fmt-products-database` | `locals.runtime.env.DB`      |
| `R2`      | R2 Bucket | `assets`                | `locals.runtime.env.R2`      |
| `SESSION` | KV        | `SESSION`               | `locals.runtime.env.SESSION` |

---

## Rules

### DO NOT

- Use `@astrojs/tailwind` — use `@tailwindcss/vite` (Tailwind 4)
- Use React — use Preact for islands
- Use Astro's `<Image>` component for R2 URLs — use plain `<img>` tags
- Store images in `public/` except favicons
- Query D1 directly from Astro pages — product data at build time comes from `src/data/*.json`; D1 is for `fmt-ecommerce-api` Worker only
- Use HTML comments in `.mdx` — use `{/* comment */}` only
- Use Corepack — being removed from Node.js 25+
- Push without running `pnpm format && pnpm lint && pnpm check` — Husky enforces this automatically, CI gates all three

### DO

- Keep SEO and OG `title`/`description` in sync in frontmatter
- Use `cdn.forestal-mt.com` for all image URLs
- Use trailing slashes on ALL URLs
- Run `pnpm format && pnpm lint && pnpm build` before every commit — all three are CI gates
- Use `.surface-warm`, `.surface-parchment`, `.surface-dark` for section backgrounds
- Use `.stagger-children` on grids, `.reveal-on-scroll` on individual elements
- Use `font-[family-name:var(--font-heading)]` pattern (not `font-cinzel` etc.)
