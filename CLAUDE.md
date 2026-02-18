# CLAUDE.md — forestal-mt-store

## What This Is

Astro 5.7+ e-commerce site for forestal-mt.com. Deployed on Cloudflare Pages. This is a **clean rebuild** from finalized specifications. All architectural decisions are made — follow the specs, don't improvise.

## Canonical Source

The `forestal-mt-suite` repository (`~/projects/forestal-mt-suite/`) is the **single source of truth** for all data, content, schemas, assets, and specifications. This project CONSUMES files from the suite — it never modifies them.

### Specification Documents (read from the suite repo)

| File | What It Defines |
|------|----------------|
| `SITE_TECHNICAL_SPEC.md` | Full stack, rendering model, URL policy, asset management, fonts, CI/CD, pnpm, Playwright |
| `UI_DESIGN_SPEC.md` | Preact islands, Tailwind CSS 4+, design tokens, color palette, component patterns, accessibility |
| `SEO_STRUCTURED_DATA_SPEC.md` | JSON-LD architecture, `@graph` builder, schema.org types, meta tags, OG cards, E-E-A-T signals |
| `SITE_URL_MANIFEST.md` | Complete URL inventory with routing patterns |
| `FORESTAL_MT_PROFILE.md` | Company profile, product catalog overview, brand context |

**Read these specs before any architectural decision.** Path: `~/projects/forestal-mt-suite/{filename}`.

### Suite Files Consumed by This Project

| Suite Path | Project Path | Purpose |
|-----------|-------------|---------|
| `pages/*.mdx` (17 files) | `src/content/pages/*.mdx` | Page content (frontmatter + body) |
| `structured-data/jsonld/*.json` (10 static schemas) | `src/data/jsonld/` | JSON-LD nodes for `@graph` injection |
| `logos-and-favicons/favicon*`, `apple-touch-icon*`, `android-chrome-*`, `mstile-*`, `safari-pinned-tab.svg`, `yandex-*`, `manifest.webmanifest`, `browserconfig.xml` (19 files) | `public/` | Favicons and web manifests |
| `logos-and-favicons/logo*` (5 files) | `src/assets/logos/` | Brand logos (processed by Astro) |
| `fonts/{family}/*.woff2` (13 files) | `src/assets/fonts/{family}/` | Self-hosted web fonts |

**Copy command pattern:** `cp ~/projects/forestal-mt-suite/{source} {project-target}`

Files are copied AS-IS. Never modified by this project. If the suite updates a file, the project copy must be refreshed.

---

## Stack

| Layer | Technology | Key Detail |
|-------|-----------|-----------|
| Framework | Astro 5.7+ | Islands Architecture, `static` output mode |
| Content | MDX | `@astrojs/mdx` — component imports in content files |
| UI framework | Preact | `@astrojs/preact` — interactive islands only |
| CSS | Tailwind CSS 4+ | `@tailwindcss/vite` plugin (NOT `@astrojs/tailwind`, NOT PostCSS) |
| SSR adapter | `@astrojs/cloudflare` | `platformProxy: { enabled: true }` for local D1/KV/R2 |
| Package manager | pnpm 10+ standalone | `"packageManager": "pnpm@10.29.3"` in package.json |
| Hosting | Cloudflare Pages | Project: `forestal-mt-store` |
| Database | Cloudflare D1 | Binding: `DB` → `fmt-products-database` |
| Object storage | Cloudflare R2 | Binding: `R2` → `assets` bucket, CDN: `cdn.forestal-mt.com` |
| Sessions | Cloudflare KV | Binding: `SESSION` → namespace `SESSION` |
| E2E testing | Playwright | `@playwright/test` + `@axe-core/playwright` |
| Performance | Lighthouse CI | `@lhci/cli`, GitHub App integration |

### Tailwind CSS 4 Setup

Tailwind 4 does NOT use `tailwind.config.mjs` or PostCSS. Config via `@tailwindcss/vite` plugin. Design tokens defined in `src/styles/global.css` using `@theme` directive.

---

## Architecture

### Meta Tags (Head.astro)

- `title` + `description` → `<title>` and `<meta name="description">` (search engine results)
- `og.title` + `og.description` → `<meta property="og:*">` and `<meta name="twitter:*">` (social sharing)
- Both come from page frontmatter. Keep SEO and OG title/description in sync.

### Rendering Model

| Type | Pages | Data Source |
|------|-------|-----------|
| **SSG** (static) | Home, About, Contact, Wholesale, 3 Catalogs, Legal pages | Content Collections (`pages/*.mdx`) |
| **SSR** (dynamic) | Shop (`/products/`), PDPs (`/products/{handler}/`) | D1 database queries |
| **Authenticated** | Account (`/account/*`), Admin (`/admin/*`) | KV sessions + D1 |

### Islands Architecture

Static HTML shell. Interactive components hydrated on demand via Preact.

| Directive | When | Use For |
|-----------|------|---------|
| `client:load` | Immediately | Cart icon, variant selector |
| `client:idle` | After main thread idle | Search autocomplete, filters |
| `client:visible` | When scrolled into view | Accordions, image zoom, maps |

### Images

ALL images served from R2 via `cdn.forestal-mt.com`. The ONLY images in `public/` are favicons.

- Product images: `cdn.forestal-mt.com/products/{type}/{handler}.png` (defined in suite `media.json`)
- Page hero images: `cdn.forestal-mt.com/pages/{slug}/hero.jpg`
- Page OG images: `cdn.forestal-mt.com/pages/{slug}/og.jpg`

### Fonts

Self-hosted via Astro experimental Fonts API (`fontProviders.local()`). 4 families, 13 woff2 files. Source in `src/assets/fonts/`. See `SITE_TECHNICAL_SPEC.md` section 5 for full configuration.

| Family | CSS Variable | Role |
|--------|-------------|------|
| The New Elegance | `--font-display` | Hero headlines (H1) |
| Cinzel | `--font-heading` | Section headings (H2+), eyebrow text |
| Libre Baskerville | `--font-body` | Body text, editorial content |
| Open Sans | `--font-ui` | UI: navigation, buttons, forms, labels |

### URL Policy

ALL URLs end with `/`. Configured via `trailingSlash: "always"`. No exceptions.

---

## MVP Scope

**Build these pages ONLY:**

| # | Page | URL | Priority |
|---|------|-----|----------|
| 1 | Home | `/` | Core |
| 2 | About | `/about/` | Core |
| 3 | Batana Oil | `/batana-oil/` | Core |
| 4 | Stingless Bee Honey | `/stingless-bee-honey/` | Core |
| 5 | Traditional Herbs | `/traditional-herbs/` | Core |
| 6 | Contact | `/contact/` | Core |
| 7 | Wholesale | `/wholesale/` | Core |
| 8 | Terms | `/terms/` | Legal |
| 9 | Privacy | `/privacy/` | Legal |
| 10 | Disclaimer | `/disclaimer/` | Legal |
| 11 | Shipping | `/shipping/` | Legal |
| 12 | 404 | N/A | Utility |

### NOT in MVP (post-launch)

- Shop, PDPs (require D1 seeding + SSR)
- Cart, Checkout, Order pages (e-commerce)
- Account, Admin (auth + KV sessions)
- Community subpages (blog, FAQs, docs, testimonials)
- Login, Register, Forgot Password

**Do NOT build post-launch features. The site must go live with catalog + contact first.**

---

## Content Format

Page files are **MDX with YAML frontmatter** (`.mdx`). MDX allows importing and using Astro/Preact components directly in content. Comments use JSX syntax: `{/* comment */}` (NOT `<!-- -->`).

Interactive elements can be embedded in content via component imports, or placed in **Astro page templates** as Preact islands.

### Content Collections

Full schema in `src/content.config.ts`. Glob loader accepts `**/*.{md,mdx}`.

**Gotcha:** Astro's glob loader uses the frontmatter `slug` field as the collection entry ID. For example, `slug: /` produces entry ID `"/"`, not `"home"`. Query with `getEntry('pages', '/')` or filter by `entry.id`.

---

## Sentry Observability

**Two-package split — mandatory for Cloudflare Pages:**

| Layer | Package | File |
|-------|---------|------|
| Client (browser) | `@sentry/astro` | `sentry.client.config.js` |
| Server (CF Workers) | `@sentry/cloudflare` | `functions/_middleware.js` |
| Build (source maps) | `@sentry/astro` plugin | `astro.config.mjs` |

- **DO NOT** use `@sentry/node` or `sentry.server.config.js` — Node SDK is incompatible with CF Workers V8 isolates
- `wrangler.toml` MUST have `nodejs_compat` flag for `@sentry/cloudflare` to work
- `@spotlightjs/astro` for local dev debugging overlay

### SSR Migration Checklist (WHEN output changes to "hybrid"/"server")

When product pages go SSR with D1 queries, these steps are **MANDATORY**:

1. Uncomment `Sentry.d1Integration(context.env.DB)` in `functions/_middleware.js`
2. Uncomment D1/KV bindings in `wrangler.toml`
3. Bind D1/KV/R2 in Cloudflare Pages dashboard (prod + preview)
4. Change `output: "static"` to `"hybrid"` in `astro.config.mjs`
5. Verify `nodejs_compat` flag is active in CF Pages dashboard settings
6. Test with `pnpm preview` (uses wrangler with local bindings)

---

## Placeholder Image Strategy

- **Real from day 1:** OG images, hero images, hero videos (from R2 / Cloudflare Stream)
- **Placeholder OK:** Content images within page body sections
- **Swap method:** Upload real file to same R2 path — zero code changes needed

---

## Build Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Dev server (Vite HMR, no Cloudflare bindings)
pnpm build            # Production build
pnpm preview          # Preview with wrangler (local Cloudflare bindings)
pnpm check            # Astro type checking
```

---

## Rules

### DO NOT

- Add e-commerce features before the catalog is live — launch first
- Use HTML comments in .mdx files — use `{/* comment */}` instead
- Use Corepack — it's being removed from Node.js 25+
- Store images in `public/` except favicons
- Import product data as JSON — it comes from D1 at runtime (post-MVP)
- Create product Content Collections — products are SSR from D1
- Use React — use Preact
- Use `@astrojs/tailwind` — use `@tailwindcss/vite` (Tailwind 4)
- Break the build — run `pnpm build` after significant changes
- Say "Great idea!" — diagnose problems, prescribe solutions
- Suggest hiring agencies/freelancers — this topic is closed

### DO

- Keep SEO and OG title/description in sync when updating frontmatter
- Follow the specs in `~/projects/forestal-mt-suite/`
- Use Tailwind CSS 4+ with `@tailwindcss/vite`
- Use Astro's experimental Fonts API for font loading
- Use trailing slashes on ALL URLs
- Use `cdn.forestal-mt.com` for all image URLs
- Keep page content in `.mdx` format
- Use placeholder images for content sections (non-hero, non-OG)
- Run `pnpm build` after every significant change
- Challenge requests that add scope beyond current MVP

---

## Language Policy

- **Conversation:** Spanish (mirror user language)
- **ALL code, files, comments, variables, commits:** English only

---

## Cloudflare Bindings

| Binding | Type | Name | Runtime Access |
|---------|------|------|---------------|
| `DB` | D1 | `fmt-products-database` | `locals.runtime.env.DB` |
| `R2` | R2 Bucket | `assets` | `locals.runtime.env.R2` |
| `SESSION` | KV | `SESSION` | `locals.runtime.env.SESSION` |

These are configured in Cloudflare Pages dashboard and `wrangler.toml`. Not needed for MVP SSG pages, but the adapter should be configured from the start.

---

## Project Structure (target)

```
forestal-mt-store/
├── CLAUDE.md
├── astro.config.mjs
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── public/
│   ├── favicon.ico
│   ├── favicon.svg
│   ├── favicon-*.png
│   ├── apple-touch-icon*.png
│   ├── android-chrome-*.png
│   ├── mstile-*.png
│   ├── safari-pinned-tab.svg
│   ├── yandex-*.png
│   ├── manifest.webmanifest
│   ├── browserconfig.xml
│   ├── yandex-browser-manifest.json
│   └── robots.txt
├── src/
│   ├── assets/
│   │   ├── fonts/
│   │   │   ├── cinzel/
│   │   │   ├── libre-baskerville/
│   │   │   ├── open-sans/
│   │   │   └── the-new-elegance/
│   │   └── logos/
│   │       ├── logo.svg
│   │       ├── logo.png
│   │       ├── logo-gold.png
│   │       ├── logo-dark.png
│   │       └── logo-light.png
│   ├── components/
│   │   ├── Head.astro          (SEO meta, OG, canonical)
│   │   ├── Header.astro        (nav, logo, search, cart icon)
│   │   ├── Footer.astro        (links, legal, newsletter)
│   │   ├── Breadcrumb.astro    (visual + JSON-LD)
│   │   └── Hero.astro          (hero section from frontmatter)
│   ├── content/
│   │   └── pages/              (17 .mdx files — migrated from suite .md)
│   ├── data/
│   │   └── jsonld/             (10 static JSON-LD schemas from suite)
│   ├── layouts/
│   │   └── BaseLayout.astro    (html shell, head, header, footer)
│   ├── lib/
│   │   └── jsonld.ts           (JSON-LD @graph builder utility)
│   ├── pages/
│   │   ├── index.astro         (Home)
│   │   ├── about/index.astro
│   │   ├── batana-oil/index.astro
│   │   ├── stingless-bee-honey/index.astro
│   │   ├── traditional-herbs/index.astro
│   │   ├── contact/index.astro
│   │   ├── wholesale/index.astro
│   │   ├── terms/index.astro
│   │   ├── privacy/index.astro
│   │   ├── disclaimer/index.astro
│   │   ├── shipping/index.astro
│   │   └── 404.astro
│   ├── styles/
│   │   └── global.css          (Tailwind import + @theme tokens)
│   └── content.config.ts
└── tests/
    └── e2e/                    (Playwright — post-MVP)
```
