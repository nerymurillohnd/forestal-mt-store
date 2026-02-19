# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

`fmt-ecommerce-api` — a Cloudflare Worker that serves the `api.forestal-mt.com` route. It is the backend for the Forestal MT e-commerce platform: product availability, cart, orders, and DHL shipping. The frontend (`forestal-mt-store`, Astro SSG) calls this Worker from Preact islands — no SSR, no direct D1 access in Astro pages.

**Status: skeleton only.** CORS + health check exist. Product, cart, order, and search routers are TODO.

## Workspace Context

This package is a pnpm workspace member of `forestal-mt-store` (parent repo at `../`).
The parent repo's CLAUDE.md covers the Astro frontend. This CLAUDE.md covers the Worker only.

**Start Claude from `api-worker/` for all API work** — separate session memory, separate context.

From the store root you can also run Worker commands without cd:

```bash
pnpm --filter api-worker dev
pnpm --filter api-worker deploy:prod
```

## Commands

```bash
pnpm dev              # wrangler dev — local Worker with D1/R2 bindings
pnpm deploy           # Deploy to preview/development env
pnpm deploy:prod      # Deploy to production (wrangler --env production)
pnpm cf-typegen       # Regenerate Cloudflare bindings types from wrangler.toml
```

No lint/test scripts exist yet. TypeScript check: `npx tsc --noEmit`.

## Architecture

### Stack

| Layer    | Technology         | Detail                                          |
| -------- | ------------------ | ----------------------------------------------- |
| Runtime  | Cloudflare Workers | V8 isolates — no Node.js APIs except via compat |
| Router   | Hono 4             | `new Hono<{ Bindings: Env }>()` pattern         |
| Database | Cloudflare D1      | Binding: `DB` → `fmt-products-database`         |
| ORM      | Drizzle ORM        | Schema in `schema.ts` (root) — SQLite dialect   |
| Storage  | Cloudflare R2      | Binding: `R2` → `assets` bucket                 |

### Env Interface (`src/index.ts`)

```ts
export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  ENVIRONMENT: string; // "development" | "production"
}
```

All route handlers access bindings via `c.env.DB`, `c.env.R2`, etc.

### D1 Schema (`schema.ts`)

Four tables, all defined with Drizzle ORM:

| Table              | Rows | Purpose                                                          |
| ------------------ | ---- | ---------------------------------------------------------------- |
| `product_groups`   | 46   | One per ProductGroup (handler = URL slug, e.g. `raw-batana-oil`) |
| `product_variants` | 132  | One per SKU — price, stock, min/max order qty live here          |
| `shipping_zones`   | 9    | Per-region transit/handling windows                              |
| `return_policies`  | 1    | Single global return policy                                      |

**Design rule:** Queryable fields (price, stockQty, availability) are columns. Non-queryable rich data (content, media, SEO) is stored as JSON blobs in `contentJson`, `mediaJson`, `seoJson` — prevents schema churn as product copy evolves.

### Planned Routers (not yet built)

Mount under `src/index.ts` at these paths:

| Path                                      | Purpose                              |
| ----------------------------------------- | ------------------------------------ |
| `GET /api/products/:handler/availability` | Live stock + pricing for PDPs        |
| `GET /api/search`                         | FTS5 search via `product_groups_fts` |
| `POST /api/cart`                          | Create/update cart (KV session)      |
| `GET /api/cart`                           | Get cart (KV session)                |
| `POST /api/orders`                        | Create order + trigger DHL AWB       |

### CORS

Hardcoded to `["https://forestal-mt.com", "http://localhost:4321"]`. Add new origins here when needed.

### Deployment Environments

- **Development** (default): `ENVIRONMENT = "development"`, binds local D1/R2 via wrangler
- **Production**: `[env.production]` in `wrangler.toml` — `pnpm deploy:prod` required; `api.forestal-mt.com` DNS record must be active (currently deleted — re-add when activating e-commerce)

## Rules

- **No Node.js built-ins** unless covered by `nodejs_compat` flag — Workers V8 only
- **No direct D1 in Astro pages** — all D1 queries go through this Worker's API
- **DHL integration** lives entirely in this Worker (not in Astro) — called at order confirmation
- **AWB PDFs** store to R2 under `awbs/` prefix
- **Drizzle migrations** not configured yet — schema changes require manual D1 migration via wrangler
