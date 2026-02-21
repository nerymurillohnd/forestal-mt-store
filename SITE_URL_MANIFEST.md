# Forestal MT - Website URL Manifest

**SITE_URL**: https://forestal-mt.com
**Total Pages**: 64 (63 indexable)
**Last Updated**: 2026-02-21

---

## Overview

forestal-mt.com is an SEO-first, UX-driven e-commerce platform for Forestal MT's ethnobotanical product catalog. Built with Astro 5 on Cloudflare Pages with `output: "static"` — all 64 deployed HTML pages are generated at build time (SSG). Content pages are driven by MDX frontmatter; product pages (Shop + 46 PDPs) are generated from 6 JSON data files in `src/data/`. One SSR endpoint exists (`POST /api/contact`) for the contact form, served via `_worker.js`. Real-time commerce data (inventory, cart, orders) will be served by client-side Preact islands fetching from `fmt-ecommerce-api` Cloudflare Worker when e-commerce is activated.

### Architecture

| Layer                        | Rendering              | Content Source                        | Pages                                                                         |
| ---------------------------- | ---------------------- | ------------------------------------- | ----------------------------------------------------------------------------- |
| **Static (SSG) — content**   | Built at deploy time   | MDX frontmatter + Astro project files | Home, About, Wholesale, Contact, Community, Legal, 3 Catalogue pages, Utility |
| **Static (SSG) — products**  | Built at deploy time   | 6 JSON data files in `src/data/`      | Shop (`/products/`), 46 PDPs (`/products/{handler}/`)                         |
| **SSR — API endpoints**      | Runtime (`_worker.js`) | Request payload                       | `/api/contact` (POST only — not a page, not indexed)                          |
| **Future scope (not built)** | SSR when implemented   | D1 + KV sessions                      | Account, Admin, Cart, Checkout, Auth pages                                    |

**Catalogue pages** (Batana Oil, Stingless Bee Honey, Traditional Herbs) are **static**. They are informational and educational — what these products are, their origin, sourcing, traditional uses, and cultural significance. They do not display prices, stock levels, or any runtime data. They link to the Shop and individual PDPs.

### Product Images

All product images are stored in Cloudflare R2 and served via CDN. No product images are stored in the Astro project.

| Image Type          | CDN Path Pattern                                                     | Dimensions |
| ------------------- | -------------------------------------------------------------------- | ---------- |
| ProductGroup main   | `https://cdn.forestal-mt.com/products/productGroup/{handler}.png`    | 1200x1200  |
| Open Graph (social) | `https://cdn.forestal-mt.com/products/og/{handler}.png`              | 1200x630   |
| Variant             | `https://cdn.forestal-mt.com/products/variants/{handler}-{size}.png` | 1200x1200  |

Full image manifest with URLs, alt text, captions, and dimensions: see `products/media.json` in this suite.

### Infrastructure

| Component        | Service            | Purpose                                                                                  |
| ---------------- | ------------------ | ---------------------------------------------------------------------------------------- |
| Domain & DNS     | Cloudflare         | `forestal-mt.com` (Zone ID: `16f3b0040dd96c240f6bfc4e2a1cdb96`)                          |
| Site hosting     | Cloudflare Pages   | Astro 5 SSG (`forestal-mt-store` project, `output: "static"`)                            |
| Product database | Cloudflare D1      | `fmt-products-database` — seeded from 6-file JSON suite                                  |
| Product images   | Cloudflare R2      | `assets` bucket → `cdn.forestal-mt.com`                                                  |
| Hero videos      | Cloudflare Stream  | 4 static pages with video hero: Home, Batana Oil, Stingless Bee Honey, Traditional Herbs |
| Sessions         | Cloudflare KV      | `SESSION` namespace for auth state                                                       |
| External API     | Cloudflare Workers | `fmt-ecommerce-api` — cart, orders, inventory (not yet active)                           |

### URL Policy

**Trailing slash**: All URLs end with `/`. Enforced via Astro config (`trailingSlash: "always"`). Requests without trailing slash 301 redirect to the trailing-slash version. No exceptions.

---

# STATIC PAGES (17 pages)

## Core Navigation Pages (8 pages)

| #   | Page Name           | Nav Label | URL                                          | Hero Type | Indexing     |
| --- | ------------------- | --------- | -------------------------------------------- | --------- | ------------ |
| 1   | Home                | Home      | https://forestal-mt.com/                     | Video     | index,follow |
| 2   | About Us            | About     | https://forestal-mt.com/about/               | Image     | index,follow |
| 3   | Wholesale           | Wholesale | https://forestal-mt.com/wholesale/           | Image     | index,follow |
| 4   | Batana Oil          | Batana    | https://forestal-mt.com/batana-oil/          | Video     | index,follow |
| 5   | Stingless Bee Honey | Honey     | https://forestal-mt.com/stingless-bee-honey/ | Video     | index,follow |
| 6   | Traditional Herbs   | Herbs     | https://forestal-mt.com/traditional-herbs/   | Video     | index,follow |
| 7   | Community           | Community | https://forestal-mt.com/community/           | Image     | index,follow |
| 8   | Contact Us          | Contact   | https://forestal-mt.com/contact/             | Image     | index,follow |

**Site Landing Page**: https://forestal-mt.com/

---

## Community Subpages (4 pages)

| #   | Page Name      | URL                                             | Description                       | Indexing     |
| --- | -------------- | ----------------------------------------------- | --------------------------------- | ------------ |
| 1   | FAQs           | https://forestal-mt.com/community/faqs/         | Frequently asked questions        | index,follow |
| 2   | Documentation  | https://forestal-mt.com/community/docs/         | Product documentation and guides  | index,follow |
| 3   | Testimonials   | https://forestal-mt.com/community/testimonials/ | Customer reviews and testimonials | index,follow |
| 4   | Blog & Stories | https://forestal-mt.com/community/blog/         | Blog posts and stories            | index,follow |

---

## Legal & Policy Pages (4 pages)

| #   | Page Name           | URL                                 | Description                                | Indexing     |
| --- | ------------------- | ----------------------------------- | ------------------------------------------ | ------------ |
| 1   | Terms & Conditions  | https://forestal-mt.com/terms/      | Terms of service                           | index,follow |
| 2   | Privacy Policy      | https://forestal-mt.com/privacy/    | Privacy and data protection                | index,follow |
| 3   | Disclaimer & Health | https://forestal-mt.com/disclaimer/ | Health disclaimers and product information | index,follow |
| 4   | Shipping & Returns  | https://forestal-mt.com/shipping/   | Shipping policies and return information   | index,follow |

---

## Utility Pages (1 page)

| #   | Page Name     | URL                          | Description               | Indexing       |
| --- | ------------- | ---------------------------- | ------------------------- | -------------- |
| 1   | 404 Not Found | https://forestal-mt.com/404/ | Custom branded error page | noindex,follow |

---

# API ENDPOINTS (not pages — not in sitemap)

These are server-side endpoints served by `_worker.js`. They are not HTML pages, not indexed, and not included in the sitemap count.

| #   | Endpoint       | Method | Handler                    | Description                                              |
| --- | -------------- | ------ | -------------------------- | -------------------------------------------------------- |
| 1   | `/api/contact` | POST   | `src/pages/api/contact.ts` | Contact form submission — validates and sends via Resend |

---

# PRODUCT PAGES — SSG (47 pages)

## Shop Page (1 page)

| #   | Page Name | Nav Label | URL                               | Description                                                                                                                                                                                   | Indexing     |
| --- | --------- | --------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| 1   | Shop      | Shop      | https://forestal-mt.com/products/ | All products listing generated from `products.json` + `pricing.json` at build time. Accepts `?q={term}` for Google Sitelinks Search Box (requires client-side filtering until SSR activates). | index,follow |

---

## Product Detail Pages (46 pages)

### Batana Oil Catalogue

| #   | Product Name                | URL                                                           | Indexing     |
| --- | --------------------------- | ------------------------------------------------------------- | ------------ |
| 1   | Batana Oil Hair Conditioner | https://forestal-mt.com/products/batana-oil-hair-conditioner/ | index,follow |
| 2   | Batana Oil Hair Wash        | https://forestal-mt.com/products/batana-oil-hair-wash/        | index,follow |
| 3   | Batana Oil True Soap Bar    | https://forestal-mt.com/products/batana-oil-true-soap-bar/    | index,follow |
| 4   | Raw Batana Oil              | https://forestal-mt.com/products/raw-batana-oil/              | index,follow |

### Stingless Bee Honey Catalogue

| #   | Product Name | URL                                        | Indexing     |
| --- | ------------ | ------------------------------------------ | ------------ |
| 5   | Jimerito     | https://forestal-mt.com/products/jimerito/ | index,follow |

### Traditional Herbs Catalogue

| #   | Product Name                | URL                                                         | Indexing     |
| --- | --------------------------- | ----------------------------------------------------------- | ------------ |
| 6   | Amaranth Greens             | https://forestal-mt.com/products/amaranth-greens/           | index,follow |
| 7   | Bay Leaves                  | https://forestal-mt.com/products/bay-leaves/                | index,follow |
| 8   | Bitter Melon - Cundeamor    | https://forestal-mt.com/products/bitter-melon-cundeamor/    | index,follow |
| 9   | Blessed - Holy Thistle      | https://forestal-mt.com/products/blessed-holy-thistle/      | index,follow |
| 10  | Cassia Pods                 | https://forestal-mt.com/products/cassia-pods/               | index,follow |
| 11  | Cat's Claw                  | https://forestal-mt.com/products/cats-claw/                 | index,follow |
| 12  | Cocolmeca Root              | https://forestal-mt.com/products/cocolmeca-root/            | index,follow |
| 13  | Contribo                    | https://forestal-mt.com/products/contribo/                  | index,follow |
| 14  | Cow's Foot Leaves           | https://forestal-mt.com/products/cows-foot-leaves/          | index,follow |
| 15  | Dragon's Blood Bark         | https://forestal-mt.com/products/dragons-blood-bark/        | index,follow |
| 16  | Duck Flower                 | https://forestal-mt.com/products/duck-flower/               | index,follow |
| 17  | Eucalyptus Leaves           | https://forestal-mt.com/products/eucalyptus-leaves/         | index,follow |
| 18  | Guaco Leaves                | https://forestal-mt.com/products/guaco-leaves/              | index,follow |
| 19  | Guava Leaves                | https://forestal-mt.com/products/guava-leaves/              | index,follow |
| 20  | Gumbo Limbo Bark            | https://forestal-mt.com/products/gumbo-limbo-bark/          | index,follow |
| 21  | Gumbo Limbo Leaves          | https://forestal-mt.com/products/gumbo-limbo-leaves/        | index,follow |
| 22  | Hibiscus Flowers            | https://forestal-mt.com/products/hibiscus-flowers/          | index,follow |
| 23  | Kalawalla Root              | https://forestal-mt.com/products/kalawalla-root/            | index,follow |
| 24  | Leaf of Life - Miracle Leaf | https://forestal-mt.com/products/leaf-of-life-miracle-leaf/ | index,follow |
| 25  | Lemongrass                  | https://forestal-mt.com/products/lemongrass/                | index,follow |
| 26  | Linden - Tilia              | https://forestal-mt.com/products/linden-tilia/              | index,follow |
| 27  | Mango Leaves                | https://forestal-mt.com/products/mango-leaves/              | index,follow |
| 28  | Moringa Leaves              | https://forestal-mt.com/products/moringa-leaves/            | index,follow |
| 29  | Muicle Herb                 | https://forestal-mt.com/products/muicle-herb/               | index,follow |
| 30  | Neem Leaves                 | https://forestal-mt.com/products/neem-leaves/               | index,follow |
| 31  | Nettle Leaves               | https://forestal-mt.com/products/nettle-leaves/             | index,follow |
| 32  | Palo Guaco                  | https://forestal-mt.com/products/palo-guaco/                | index,follow |
| 33  | Palo Santo                  | https://forestal-mt.com/products/palo-santo/                | index,follow |
| 34  | Pau D'Arco Bark             | https://forestal-mt.com/products/pau-darco-bark/            | index,follow |
| 35  | Pine Needles                | https://forestal-mt.com/products/pine-needles/              | index,follow |
| 36  | Plantain Leaf               | https://forestal-mt.com/products/plantain-leaf/             | index,follow |
| 37  | Possum Grape - Cissus       | https://forestal-mt.com/products/possum-grape-cissus/       | index,follow |
| 38  | Quassia - Bitter Wood       | https://forestal-mt.com/products/quassia-bitter-wood/       | index,follow |
| 39  | Sarsaparilla                | https://forestal-mt.com/products/sarsaparilla/              | index,follow |
| 40  | Sensitive Plant             | https://forestal-mt.com/products/sensitive-plant/           | index,follow |
| 41  | Snake Plant                 | https://forestal-mt.com/products/snake-plant/               | index,follow |
| 42  | Soursop Leaves              | https://forestal-mt.com/products/soursop-leaves/            | index,follow |
| 43  | Stonebreaker                | https://forestal-mt.com/products/stonebreaker/              | index,follow |
| 44  | Taro - Malanga Leaf         | https://forestal-mt.com/products/taro-malanga-leaf/         | index,follow |
| 45  | Thuja - Cedar Leaves        | https://forestal-mt.com/products/thuja-cedar-leaves/        | index,follow |
| 46  | Trumpet Tree Leaves         | https://forestal-mt.com/products/trumpet-tree-leaves/       | index,follow |

---

---

# FUTURE SCOPE (not yet built)

These pages are planned but do not exist in the current codebase. When implemented, they will require `output: "hybrid"` (Astro SSR), D1 product database queries, and KV session management. All will be `noindex` when live.

## Auth Pages

| #   | Page Name       | URL                                      | Description               | Indexing         |
| --- | --------------- | ---------------------------------------- | ------------------------- | ---------------- |
| 1   | Login           | https://forestal-mt.com/login/           | Customer authentication   | noindex,follow   |
| 2   | Register        | https://forestal-mt.com/register/        | Customer account creation | noindex,follow   |
| 3   | Forgot Password | https://forestal-mt.com/forgot-password/ | Password recovery         | noindex,nofollow |
| 4   | Reset Password  | https://forestal-mt.com/reset-password/  | Password reset form       | noindex,nofollow |

## E-Commerce Pages

| #   | Page Name          | URL                                         | Description                | Indexing         |
| --- | ------------------ | ------------------------------------------- | -------------------------- | ---------------- |
| 1   | Cart               | https://forestal-mt.com/cart/               | Shopping cart panel/page   | noindex,follow   |
| 2   | Checkout           | https://forestal-mt.com/checkout/           | Order checkout flow        | noindex,nofollow |
| 3   | Order Confirmation | https://forestal-mt.com/order-confirmation/ | Post-purchase confirmation | noindex,nofollow |
| 4   | Order Tracking     | https://forestal-mt.com/order-tracking/     | Shipment tracking lookup   | noindex,nofollow |

## Customer Account Pages

| #   | Page Name        | URL                                       | Description             | Indexing         |
| --- | ---------------- | ----------------------------------------- | ----------------------- | ---------------- |
| 1   | My Account       | https://forestal-mt.com/account/          | Account dashboard       | noindex,nofollow |
| 2   | My Orders        | https://forestal-mt.com/account/orders/   | Order history           | noindex,nofollow |
| 3   | Wishlist         | https://forestal-mt.com/account/wishlist/ | Saved products          | noindex,nofollow |
| 4   | Account Settings | https://forestal-mt.com/account/settings/ | Profile and preferences | noindex,nofollow |

## Admin Pages

| #   | Page Name            | URL                                      | Description         | Indexing         |
| --- | -------------------- | ---------------------------------------- | ------------------- | ---------------- |
| 1   | Admin Dashboard      | https://forestal-mt.com/admin/           | Operations overview | noindex,nofollow |
| 2   | Product Management   | https://forestal-mt.com/admin/products/  | Product CRUD        | noindex,nofollow |
| 3   | Order Management     | https://forestal-mt.com/admin/orders/    | Order processing    | noindex,nofollow |
| 4   | Inventory Management | https://forestal-mt.com/admin/inventory/ | Stock management    | noindex,nofollow |

---

_Website URL manifest for structure reference and sitemap planning_
_Forestal Murillo Tejada S. de R.L. - Forestal MT_
