# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Astro 5.7+ e-commerce site for forestal-mt.com. Deployed on Cloudflare Pages. This is a **clean rebuild** from finalized specifications. All architectural decisions are made — follow the specs, don't improvise.

## Canonical Source

The `forestal-mt-suite` repository (`~/projects/forestal-mt-suite/`) is the **single source of truth** for all data, content, schemas, assets, and specifications. This project CONSUMES files from the suite — it never modifies them.

Copies of the main spec docs live in this repo root for quick reference:

- `SEO_STRUCTURED_DATA_SPEC.md` — JSON-LD architecture, schema.org types, meta tags
- `SITE_TECHNICAL_SPEC.md` — Full stack, rendering model, fonts, CI/CD
- `SITE_URL_MANIFEST.md` — Complete URL inventory (72 pages total)

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
pnpm lighthouse       # Lighthouse CI audit (requires built dist/)
```

**CI gates:** `pnpm format:check`, `pnpm lint`, and `pnpm build` all run in GitHub Actions. Any failure blocks deploy.

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
| Hosting         | Cloudflare Pages      | Project: `forestal-mt-store`, auto-deploy on push to main                   |
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

| Type              | Pages                                                                          | Data Source                             |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------- |
| **SSG** (static)  | Home, About, Contact, Wholesale, 3 Catalogs, Community hub + 4 subpages, Legal | Content Collections (`pages/*.mdx`)     |
| **SSR** (dynamic) | Shop (`/products/`), PDPs (`/products/{handler}/`)                             | D1 database queries — **not yet built** |
| **Authenticated** | Account (`/account/*`), Admin (`/admin/*`)                                     | KV sessions + D1 — **not yet built**    |

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

Data-driven from frontmatter `hero.*`. Two background modes:

- `background.type: "image"` → `<img>` from R2 CDN
- `background.type: "video"` → HLS via hls.js from Cloudflare Stream

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

---

## Live Pages (17 SSG pages)

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
| `/404`                     | 404 Not Found               |

**Next phase:** Shop + 46 PDPs (requires D1 seeding + SSR migration).

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
- Import product data as JSON — products come from D1 at runtime (SSR)
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
