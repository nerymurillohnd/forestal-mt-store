# Rich Results Audit — Google Rich Results Test

**Session:** 2026-02-20
**Method:** Pasting `dist/` HTML directly into Google Rich Results Test
**Scope:** All 64 pages (17 content + 47 product)

---

## Rules

- **All R2 images must be used.** No orphaned images allowed. Every image uploaded to R2
  must be referenced in the page it belongs to (hero, OG, or content). If not used → delete
  from R2 or wire it in. No exceptions.

---

## Legend

- ✅ Clean — no issues
- ⚠️ Warning — non-blocking, best practice gap
- ❌ Bug — needs fix
- ⏭️ Skipped — not relevant (noindex, no schema)

---

## Resource Failures (Global — Ignore)

All pages show `/_astro/` asset failures (JS, fonts, CSS) and JS console errors referencing
`example-test.site`. This is a sandbox artifact of pasting local `dist/` HTML — not a real issue.
Googlebot crawls the live site where all assets resolve correctly.

---

## Pages Audited

### 404

- **Status:** ⏭️ Skipped
- **Reason:** noindex, no schema, no structured data expected. Resource failures are sandbox artifact.

---

### /about/

- **Status:** ✅ Schema clean | ✅ Image transforms fixed | ✅ Orphan wired
- **Schemas detected:** BreadcrumbList (1 valid element, 0 errors, 0 warnings)
- **Notes:** Last ListItem has no `item` URL — intentional per Google guidelines (correct).

#### ✅ Fixed: Image transforms (Fix #1)

All 4 content images now pass through `/cdn-cgi/image/format=auto`:

- `murillo-tejada-family.jpg` — direct `<img>` wrapped with `cdnImage()` (about/index.astro)
- `the-founder-legacy.jpg`, `ethnobotanical-collections.jpg`, `indiginuos-partner.jpg` — fixed via `SplitEditorial.astro` component-level fix

#### ✅ Fixed: Orphan wired (Fix #2)

`sourced-from-origin.jpg` — wired into Section 13 (Community Impact) via `SplitEditorial`
in about/index.astro. Section replaced text-only layout with image+text split.

---

### /batana-oil/

- **Status:** ✅ Schema clean | ✅ Image transforms fixed (Fix #1)
- **Schemas detected:** BreadcrumbList + VideoObject (2 valid elements, 0 errors, 0 warnings)
- **VideoObject booleans** (`isFamilyFriendly`, `isAccessibleForFree`, `requiresSubscription`)
  display as `http://schema.org/True/False` in test UI — this is normal rendering, values are
  correct JSON booleans in the HTML.

#### ✅ Fixed: Image transforms (Fix #1)

All 9 previously raw images now pass through `/cdn-cgi/image/format=auto`:

- 4 direct `<img>` tags in batana-oil/index.astro wrapped with `cdnImage()`
- 5 via component-level fixes to `OriginChapter.astro` and `SplitEditorial.astro`

---

### /stingless-bee-honey/

- **Status:** ✅ Schema clean | ❌ Broken image in production | ❌ Raw img no transform
- **Schemas detected:** BreadcrumbList + VideoObject (2 valid elements, 0 errors, 0 warnings)

#### ❌ CRITICAL: Broken image in production

`pages/stingless-bee-honey/heritage.jpg` — referenced in `OriginChapter` (source line ~223)
for the Maya heritage / traditional log hive section. **File does not exist in R2.** Live 404.

- Alt: _"Traditional log hive of Tetragonisca angustula stingless bees in Honduran forest"_
- **Fix:** Upload correct image to R2 `pages/stingless-bee-honey/heritage.jpg`, then wrap
  with `/cdn-cgi/image/format=auto` at call site.

---

### /traditional-herbs/

- **Status:** ✅ Schema clean | ✅ Fixed: broken image + orphan | ❌ Raw img no transform
- **Schemas detected:** BreadcrumbList + VideoObject (2 valid elements, 0 errors, 0 warnings)
- **41 herb product images:** all correctly transformed `width=280,format=auto` ✓

#### ✅ Fixed: Broken image + orphan resolved

- `origin.jpg` — was missing from R2 (broken in production). Uploaded. No code change needed.
- `cats-claw-bark-wildcrafted.png` — orphaned in R2 (1.7 MB PNG). Deleted from bucket.

#### ❌ Bug: `origin.jpg` raw (no transform)

`OriginChapter` at line ~472 receives raw URL. Covered by the global image transform fix (batch).

---

### /contact/

- **Status:** ✅ Schema clean | ✅ Fixed: wrong hero image
- **Schemas detected:** BreadcrumbList (1 valid element, 0 errors, 0 warnings)
- **R2 images:** `hero.jpg` + `og.jpg` — both used ✓

#### ✅ Fixed: Wrong hero image (`contact.mdx` line 76)

`background.url` pointed to `pages/about/hero.jpg`. Corrected to `pages/contact/hero.jpg`.
`pages/contact/hero.jpg` was orphaned in R2 — now wired in.

---

### /wholesale/

- **Status:** ✅ Schema clean | ❌ Broken image (blocked) | ✅ Orphan wired (Fix #5) | ✅ Raw imgs fixed (Fix #1)
- **Schemas detected:** BreadcrumbList (1 valid element, 0 errors, 0 warnings)

#### ❌ BLOCKED: Broken image in production (Fix #4)

`pages/wholesale/private-label.jpg` — referenced in Private Label section (line ~330).
Does not exist in R2. Live 404. **Nery to supply image — blocked pending asset delivery.**

#### ✅ Fixed: Orphan wired (Fix #5)

`global-reach-dhl-express.jpg` — added to Shipping Options section below the DHL/Maritime
cards in wholesale/index.astro. Full-width image with `cdnImage()` transform.

#### ✅ Fixed: Collection card images + catalog heroes (Fix #1)

3 catalog hero images in Collections Preview cards now wrapped with `cdnImage(w: 800)`.
Previously raw `<img>` tags with no format negotiation.

---

### /community/

- **Status:** ✅ Clean
- **Schemas detected:** BreadcrumbList (1 valid element, 0 errors, 0 warnings)
- **R2 images:** `hero.jpg` (transformed ✓) + `og.jpg` (raw ✓) — both used, no orphans

---

### /community/faqs/

- **Status:** 🔲 Pending

---

### /community/blog/

- **Status:** 🔲 Pending

---

### /community/testimonials/

- **Status:** 🔲 Pending

---

### /community/docs/

- **Status:** 🔲 Pending

---

### /terms/

- **Status:** 🔲 Pending

---

### /privacy/

- **Status:** ✅ Clean
- **Schemas detected:** BreadcrumbList (1 valid element, 0 errors, 0 warnings)
- **R2 images:** `og.jpg` only — legal page, dark gradient hero, no content images ✓

---

### /disclaimer/

- **Status:** ✅ Clean
- **Schemas detected:** BreadcrumbList (1 valid element, 0 errors, 0 warnings)
- **R2 images:** `og.jpg` only — legal page, dark gradient hero, no content images ✓

---

### /shipping/

- **Status:** 🔲 Pending

---

### /products/ (Shop)

- **Status:** ✅ Schema clean | ✅ Fixed: breadcrumb name
- **Schemas detected:** BreadcrumbList + OnlineStore (2 valid elements, 0 errors, 0 warnings)
- **46 product images:** all correctly transformed `width=400,format=auto` ✓

#### ✅ Fixed: Wrong breadcrumb name (`src/lib/product-jsonld.ts` lines 283 + 320)

`"Shop All Products"` → `"Products"` — matches `pageName: Products` in `products.mdx`.

---

### /products/{handler}/ (46 PDPs)

- **Status:** 🔲 Pending — audit a sample (raw-batana-oil, jimerito-honey-8oz, one herb)

---

## Fixes Pending (Summary)

| #   | File / Scope                                 | Issue                                                                 | Priority |
| --- | -------------------------------------------- | --------------------------------------------------------------------- | -------- |
| 4   | R2 `pages/wholesale/private-label.jpg`       | Missing from R2 — broken in production. **Nery to supply image.**     | Critical |
| —   | `/stingless-bee-honey/` raw img no transform | `OriginChapter` component fix already applied — verify on next audit. | Low      |
| —   | `/traditional-herbs/` raw img no transform   | `OriginChapter` component fix already applied — verify on next audit. | Low      |

---

## Completed Fixes

| #   | File                                                                               | Fix                                                                                                                                                         |
| --- | ---------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `src/content/pages/contact.mdx` line 76                                            | Wrong hero: `pages/about/hero.jpg` → `pages/contact/hero.jpg`                                                                                               |
| 2   | `src/pages/stingless-bee-honey/index.astro` line ~223                              | `heritage.jpg` (missing) → `jimerito-melipona-log-hive.jpg` (uploaded to R2)                                                                                |
| 3   | R2 `pages/traditional-herbs/`                                                      | `origin.jpg` uploaded (was broken). `cats-claw-bark-wildcrafted.png` deleted (orphan).                                                                      |
| 4   | `src/lib/product-jsonld.ts` lines 283 + 320                                        | `"Shop All Products"` → `"Products"` in CollectionPage name + BreadcrumbList.                                                                               |
| 1★  | `OriginChapter.astro`, `SplitEditorial.astro`, `about`, `batana-oil`, `wholesale`  | All content images now wrapped with `cdnImage()` — WebP/AVIF negotiation via `/cdn-cgi/image/format=auto`. Component-level fix covers all pages.            |
| 2★  | `src/pages/about/index.astro` Section 13                                           | `sourced-from-origin.jpg` wired into Community Impact section via `SplitEditorial`.                                                                         |
| 5★  | `src/pages/wholesale/index.astro` Shipping section                                 | `global-reach-dhl-express.jpg` added below DHL/Maritime cards. 3 collection card images now transformed.                                                    |
| 6★  | `src/lib/product-jsonld.ts` + `ContentData` + `src/pages/products/[handler].astro` | ProductGroup schema expanded: `material`, `keywords` (from `tags`), `additionalProperty` array (botanicalName + qualityBadge), `audience` (PeopleAudience). |
