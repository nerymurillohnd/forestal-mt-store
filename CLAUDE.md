# CLAUDE.md

Project instructions for Claude Code. This file is the operational guide for `forestal-mt.com`.

## What This Is

Astro 5.7+ e-commerce storefront for **Forestal MT** — live at `forestal-mt.com`, deployed on Cloudflare Pages. 64 pages (63 indexable), 46 products, 132 SKUs. GSC-verified, sitemap registered, actively crawled and indexed.

This is a **production business** competing against established players. Every change ships to real customers. No prototypes, no experiments on main.

---

## Workspace

pnpm monorepo with two packages:

| Package             | Directory     | Deployment                                  |
| ------------------- | ------------- | ------------------------------------------- |
| `forestal-mt-store` | `/` (root)    | Cloudflare Pages — GH Actions 6-stage gated |
| `fmt-ecommerce-api` | `api-worker/` | Cloudflare Worker — manual or GH Actions    |

Shared `pnpm-lock.yaml` at root. Both packages have their own `CLAUDE.md`.

**Session boundary:** Start Claude Code from the directory matching the task:

- Astro pages, content, components, SEO → `forestal-mt-store/` (here)
- API routes, D1 schema, Hono handlers, DHL → `forestal-mt-store/api-worker/`

**HARD RULE:** If a task requires substantive `api-worker/` development (Hono routes, `schema.ts`, D1 migrations, DHL integration) — **STOP. Say explicitly:** "This must be done from a session started in `api-worker/`." Only exception: one-liner edits to `api-worker/package.json`, `wrangler.toml`, or `CLAUDE.md`.

**Cross-workspace commands:**

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
pnpm lint             # ESLint — runs in CI, must pass before merge
pnpm lint:fix         # ESLint with auto-fix
pnpm format           # Prettier write
pnpm format:check     # Prettier check (local hook + manual verification)
pnpm quality:prepush   # Husky pre-push gate: format:check + lint + check
pnpm test:e2e         # Playwright end-to-end tests
pnpm test:e2e:ui      # Playwright with interactive UI
pnpm lighthouse       # Lighthouse CI audit (localhost, requires built dist/)
pnpm lighthouse:prod  # Lighthouse CI audit (production URLs)
```

**CI pipeline (6 jobs):** Lint → Build → E2E → Lighthouse (localhost, push-only) → Deploy → Lighthouse (production, monitoring). Deploy is for push-to-main only. On PRs, Stages 1-3 are blocking, stage 4 is naturally skipped, then stage 6 requires deploy completion.

**Local quality (Husky):**

- Pre-commit: `pnpm lint`
- Pre-push: `pnpm quality:prepush`
- PostToolUse hook: Prettier auto-runs on every file write

---

## Stack

| Layer            | Technology            | Key Detail                                                               |
| ---------------- | --------------------- | ------------------------------------------------------------------------ |
| Framework        | Astro 5.7+            | Islands Architecture, `output: "static"`                                 |
| Content          | MDX                   | `@astrojs/mdx` — component imports in content files                      |
| UI framework     | Preact                | `@astrojs/preact` — interactive islands only (NOT React)                 |
| CSS              | Tailwind CSS 4+       | `@tailwindcss/vite` plugin (NOT `@astrojs/tailwind`, NOT PostCSS)        |
| SSR adapter      | `@astrojs/cloudflare` | `platformProxy: { enabled: true }` for local D1/KV/R2                    |
| Package manager  | pnpm 10+ standalone   | `"packageManager": "pnpm@10.29.3"` — no Corepack                         |
| Hosting          | Cloudflare Pages      | Project: `forestal-mt-store`, custom domains: `forestal-mt.com` + `www.` |
| Database         | Cloudflare D1         | Binding: `DB` → `fmt-products-database` (pending — SSR not yet enabled)  |
| Object storage   | Cloudflare R2         | Binding: `R2` → `assets` bucket, CDN: `cdn.forestal-mt.com`              |
| Sessions         | Cloudflare KV         | Binding: `SESSION` → namespace `SESSION` (pending)                       |
| Video            | Cloudflare Stream     | 4 HLS hero videos, MP4 downloads enabled                                 |
| Icons            | astro-icon            | `@iconify-json/fa6-brands` (social), `@iconify-json/logos` (payment)     |
| Observability    | Sentry                | `@sentry/astro` (client, error-only) + `@sentry/cloudflare` (server)     |
| Email            | Resend                | Transactional from `@forestal-mt.com` — `RESEND_API_KEY` env var         |
| Anti-abuse       | Cloudflare Turnstile  | Invisible widget on contact form + WAF rate limiting                     |
| Phone validation | libphonenumber-js     | Country-aware validation in `ContactFormIsland`                          |
| Analytics        | Cloudflare Zaraz      | GA4 `G-FHNE3TBXMW` — auto-injected, NO manual `<script>` tags            |

### Tailwind CSS 4

No `tailwind.config.mjs`, no PostCSS. Config via `@tailwindcss/vite` plugin. Design tokens in `src/styles/global.css` using `@theme` directive.

---

## Architecture

### Rendering Model

| Type               | Pages                                                                          | Data Source                                     |
| ------------------ | ------------------------------------------------------------------------------ | ----------------------------------------------- |
| **SSG — content**  | Home, About, Contact, Wholesale, 3 Catalogs, Community hub + 4 subpages, Legal | Content Collections (`src/content/pages/*.mdx`) |
| **SSG — products** | Shop (`/products/`), 46 PDPs (`/products/{handler}/`)                          | 7 JSON files in `src/data/jsonld/products/`     |
| **SSR — API**      | `/api/contact` (POST — not a page, not indexed)                                | Request payload → Resend                        |
| **Future scope**   | Account, Admin, Cart, Checkout, Auth                                           | SSR + D1 + KV — not yet built                   |

### Content Collections

Schema: `src/content.config.ts`. Glob loader: `src/content/pages/**/*.{md,mdx}`.

**Critical:** Astro's glob loader uses the frontmatter `slug` field as the collection entry ID:

```ts
// slug: community/faqs  → getEntry("pages", "community/faqs")
// slug: /               → getEntry("pages", "/")
const page = await getEntry("pages", "community/faqs");
```

Every MDX file requires: `slug`, `pageName`, `canonicalUrl`, `title`, `description`, `og`, `twitter`, `schemas`, `hero`.

### Product Data (`src/data/jsonld/products/`)

7 JSON files define all 46 products at build time:

| File             | Content                                    |
| ---------------- | ------------------------------------------ |
| `products.json`  | Core product definitions, handlers, groups |
| `content.json`   | Descriptions, materials, botanical info    |
| `pricing.json`   | Prices per variant                         |
| `inventory.json` | Stock levels, availability                 |
| `media.json`     | Image URLs per product                     |
| `seo.json`       | Meta titles, descriptions per product      |
| `wholesale.json` | Wholesale-specific pricing and minimums    |

### JSON-LD Schema Builder (`src/lib/jsonld.ts`)

`buildPageGraph(schemas, pageData)` resolves schema refs from frontmatter into a `@graph` array. Supported types:

| Frontmatter `type`                                                         | Produces                                       |
| -------------------------------------------------------------------------- | ---------------------------------------------- |
| `Organization`, `Brand`                                                    | Full or compact stub (`mode: compact`)         |
| `WebSite`, `SearchAction`                                                  | Global site schemas                            |
| `VideoObject`                                                              | Matched by `@id` from stream-videos lookup     |
| `BreadcrumbList`                                                           | Auto-built from `pageName` + `canonicalUrl`    |
| `ImageObject`                                                              | Built from `og.image` data                     |
| `AboutPage`, `Blog`, `CollectionPage`, `ContactPage`, `FAQPage`, `WebPage` | WebPage variants                               |
| `OfferCatalog`, `Service`                                                  | From OnlineStore.json / Service-wholesale.json |

Unknown types silently return null. Add new cases to the switch when needed.

### Hero Component (`src/components/Hero.astro`)

Data-driven from frontmatter `hero.*`. Three background modes:

- `background.type: "video"` → HLS via hls.js from Cloudflare Stream (MP4 fallback via `getStreamMp4()`)
- `background.type: "image"` → `<img>` from R2 CDN
- No `background` field → dark gradient only (community subpages, legal pages)

Video UIDs in `src/data/stream-videos.ts`. Hero images: 1920x1080 (16:9). Hero videos: 3200x1792. Video preload: `metadata` (not `auto`).

### Breadcrumb Component

```astro
<!-- Top-level page -->
<Breadcrumb pageName={data.pageName} />

<!-- Community subpage (3 levels: Home → Community → Page) -->
<Breadcrumb pageName={data.pageName} parent={{ name: "Community", href: "/community/" }} />
```

### Preact Islands (`src/components/islands/`)

All islands use Preact (not React). Hydrated on demand.

| Island                     | Directive        | Purpose                                     |
| -------------------------- | ---------------- | ------------------------------------------- |
| `AccordionIsland.tsx`      | `client:visible` | Collapsible content panels                  |
| `BatanaBenefitsIsland.tsx` | `client:visible` | Batana oil benefits interactive display     |
| `ContactFormIsland.tsx`    | `client:visible` | Contact form + Turnstile + phone validation |
| `CountUpIsland.tsx`        | `client:visible` | Animated number counters                    |
| `HerbScrollIsland.tsx`     | `client:visible` | Horizontal herb catalog scroll              |
| `ImpactBarIsland.tsx`      | `client:visible` | Animated metric bars                        |
| `OriginPulseIsland.tsx`    | `client:visible` | Map/pulse animation                         |
| `ScrollRevealIsland.tsx`   | `client:visible` | Scroll-triggered reveals                    |
| `ShopFilterIsland.tsx`     | `client:visible` | Product filtering on shop page              |
| `TabSwitcherIsland.tsx`    | `client:idle`    | Tabbed content switcher                     |
| `WholesaleMapIsland.tsx`   | `client:visible` | Wholesale coverage map                      |

---

## Design System

### CSS Utility Classes (`src/styles/global.css`)

| Class                | Effect                                                      |
| -------------------- | ----------------------------------------------------------- |
| `.surface-warm`      | Warm off-white background                                   |
| `.surface-parchment` | Parchment background (`#F5F0E8`)                            |
| `.surface-dark`      | Charcoal background (`#1A1A1A`) + light text                |
| `.grain`             | Noise texture overlay (`::before`, needs `relative` parent) |
| `.gold-rule`         | Centered gold decorative `<hr>`                             |
| `.gold-rule-left`    | Left-aligned gold rule                                      |
| `.stagger-children`  | Sequential fade-in animation (up to 6 children)             |
| `.reveal-on-scroll`  | Scroll-triggered visibility (JS toggles `.is-visible`)      |
| `.card-hover`        | White card with lift shadow + border on hover               |

### Color Tokens

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

Usage: `font-[family-name:var(--font-heading)]` in Tailwind classes.

Fonts in `src/assets/fonts/` (woff2) — Astro `experimental.fonts` with `fontProviders.local()`.

---

## Images

All images served from R2 via `cdn.forestal-mt.com`. Only favicons live in `public/`.

- Product images: `cdn.forestal-mt.com/products/{type}/{handler}.png` (1200x1200)
- Page hero images: `cdn.forestal-mt.com/pages/{slug}/hero.jpg` (1920x1080)
- Page OG images: `cdn.forestal-mt.com/pages/{slug}/og.jpg` (1200x630)

**Image Resizing** is active. Use `cdnImage()` from `src/lib/image.ts` — it applies `/cdn-cgi/image/width=X,format=auto/{url}` and guards against double-transforms.

**Never use Astro's `<Image>` for R2 URLs** — `passthroughImageService()` is configured, Sharp is disabled. Use plain `<img>` tags.

### R2 Asset Isolation Rule

Each page uses **only its own R2 folder**. `/wholesale/` → `pages/wholesale/`. Cross-folder references are forbidden.

**Only exception:** catalog collection cards pull hero images from `products/{ProductGroup}/` — the same ProductGroup image used in PDPs. This is intentional.

---

## Sitemap & SEO

- **Sitemap**: `fmt-sitemap-index.xml` registered in GSC. `serialize()` in `astro.config.mjs` adds `<image:image>` entries (47 PDPs + 9 content pages) and `<video:video>` entries (4 hero video pages). Uses `media.json` at build time.
- **og:video**: 4 pages have `og:video` meta (HLS URLs, `application/x-mpegURL`). Configured in MDX frontmatter + `Head.astro`.
- **Canonical**: Every page has `<link rel="canonical">`. `trailingSlash: "always"` enforced.
- **Redirects**: `public/_redirects` — 500+ rules covering legacy SKU URLs, trailing slash normalization, old page names. 301 permanent.
- **robots.txt**: AI training crawlers blocked, search crawlers allowed, `archive.org_bot` currently blocked.

---

## Live Pages (64 deployed — 63 indexable)

**Content pages (17):**

| URL                        | Page                    |
| -------------------------- | ----------------------- |
| `/`                        | Home                    |
| `/about/`                  | About                   |
| `/batana-oil/`             | Batana Oil catalog      |
| `/stingless-bee-honey/`    | Stingless Bee Honey     |
| `/traditional-herbs/`      | Traditional Herbs       |
| `/contact/`                | Contact                 |
| `/wholesale/`              | Wholesale Program       |
| `/community/`              | Community hub           |
| `/community/faqs/`         | FAQs                    |
| `/community/blog/`         | Blog & Stories          |
| `/community/testimonials/` | Testimonials            |
| `/community/docs/`         | Documentation           |
| `/terms/`                  | Terms & Conditions      |
| `/privacy/`                | Privacy Policy          |
| `/disclaimer/`             | Disclaimer              |
| `/shipping/`               | Shipping & Returns      |
| `/404`                     | 404 Not Found (noindex) |

**Product pages (47):** `/products/` (shop) + 46 PDPs (`/products/{handler}/`). Full list in `SITE_URL_MANIFEST.md`.

---

## Sentry

Two-package split — mandatory for Cloudflare Pages:

| Layer               | Package              | File                       |
| ------------------- | -------------------- | -------------------------- |
| Client (browser)    | `@sentry/astro`      | `sentry.client.config.js`  |
| Server (CF Workers) | `@sentry/cloudflare` | `functions/_middleware.js` |
| Build (source maps) | `@sentry/astro`      | `astro.config.mjs`         |

Client is **error-only** — Replay, Tracing, and Feedback removed for bundle size (~300KB saved). `bundleSizeOptimizations` enabled. Do NOT use `@sentry/node` — incompatible with CF Workers V8 isolates.

---

## Email & Contact Form

**Outbound (Resend):** `POST /api/contact` maps `sendTo` labels (sales/support/admin) to `@forestal-mt.com` addresses server-side — never exposed to client.

**Inbound (CF Email Routing):** `admin@`, `sales@`, `support@forestal-mt.com` → `forestalmt.hn@gmail.com`.

**Contact form stack:**

- `src/pages/api/contact.ts` — SSR endpoint (`prerender = false`), validates + Turnstile verify + sends via Resend
- `src/components/islands/ContactFormIsland.tsx` — Preact island with Turnstile (lazy-injected, not in `<head>`)
- `src/lib/contact-limits.ts` — field limits shared between island (UI) and API (validation)
- `src/data/countries.ts` — `COUNTRIES` array + `PRIORITY_COUNTRY_CODES` (16 markets)

---

## Pending: E-Commerce Activation

**Full spec:** `docs/architecture/pdp-ecommerce-architecture.md`

PDPs are static (JSON at build time). Cart activation requires Preact islands fetching from `fmt-ecommerce-api`. **Do NOT switch to `output: "hybrid"` for PDPs** — SSG shell + client-side API is correct.

### Required before cart launch

- [ ] `ProductAvailabilityIsland` replaces static price/availability block
- [ ] API Worker endpoints: availability, cart, orders
- [ ] DHL Express API integration (shipment creation, AWB, rates, tracking)
- [ ] `api.forestal-mt.com` DNS record → Worker route
- [ ] KV `SESSION` binding in CF Pages dashboard
- [ ] Worker secrets: `DHL_API_KEY`, `DHL_ACCOUNT_NUMBER`
- [ ] CORS on API Worker (allow `forestal-mt.com`)

### JSON-LD — Deferred Until DHL

- **`shippingRate`** — dynamic, calculated per-order by DHL API. Do NOT hardcode.
- **`priceValidUntil`** — business decision. Do not add without Nery's instruction.

---

## SSR Migration Checklist

When switching `output: "static"` → `"hybrid"`:

1. Uncomment `Sentry.d1Integration(context.env.DB)` in `functions/_middleware.js`
2. Uncomment D1/KV bindings in `wrangler.toml`
3. Bind D1/KV in CF Pages dashboard (prod + preview)
4. Change `output` in `astro.config.mjs`
5. Verify `nodejs_compat` flag in CF Pages dashboard
6. **Move security headers from `public/_headers` to `functions/_middleware.js`** — `_headers` does NOT apply to Pages Functions responses
7. Test with `pnpm preview`

---

## Cloudflare Bindings

| Binding   | Type      | Name                    | Runtime Access               | Status  |
| --------- | --------- | ----------------------- | ---------------------------- | ------- |
| `R2`      | R2 Bucket | `assets`                | `locals.runtime.env.R2`      | Bound   |
| `DB`      | D1        | `fmt-products-database` | `locals.runtime.env.DB`      | Pending |
| `SESSION` | KV        | `SESSION`               | `locals.runtime.env.SESSION` | Pending |

---

## Rules

### DO NOT

- Use `@astrojs/tailwind` — use `@tailwindcss/vite` (Tailwind 4)
- Use React — use Preact for islands
- Use Astro's `<Image>` for R2 URLs — use plain `<img>` with `cdnImage()`
- Store images in `public/` (except favicons)
- Query D1 from Astro pages — product data comes from JSON at build time; D1 is for `fmt-ecommerce-api` only
- Use HTML comments in `.mdx` — use `{/* comment */}`
- Use Corepack — being removed from Node.js 25+
- Add manual GA4 `<script>` tags — Zaraz handles analytics injection
- Push without quality gates — Husky enforces format + lint + check

### DO

- Keep SEO and OG `title`/`description` in sync in frontmatter
- Use `cdn.forestal-mt.com` for all image URLs
- Use trailing slashes on ALL URLs
- Run `pnpm build` after significant changes — catch errors before they deploy
- Use `.surface-warm`, `.surface-parchment`, `.surface-dark` for section backgrounds
- Use `font-[family-name:var(--font-heading)]` pattern
- Use `cdnImage()` from `src/lib/image.ts` for all R2 image URLs
