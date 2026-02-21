# SEO Crawling — Sitemap, robots.txt, PWA Manifest Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the 75-byte stub robots.txt and unconfigured sitemap with a production-grade SEO/crawling stack: renamed split sitemap with lastmod, a full AI crawler policy in robots.txt, and a corrected PWA manifest.

**Architecture:** Five static files modified + one config change. All output is SSG — no runtime code. `@astrojs/sitemap@3.7.0` handles sitemap generation via `filenameBase` + `chunks` + `serialize` + `filter`. robots.txt and manifest are static files in `public/`. Head.astro and browserconfig.xml receive targeted additions/fixes.

**Tech Stack:** Astro 5.7+, `@astrojs/sitemap@3.7.0`, Cloudflare Pages (SSG), pnpm 10

---

## Context

- Worktree: `.worktrees/seo-crawling` — branch `feature/seo-crawling`
- All commands run from the worktree root: `/home/nmurillo/projects/forestal-mt-store/.worktrees/seo-crawling/`
- CI gates: lint → build → E2E → Lighthouse → deploy. Build must pass after every task.
- **Critical constraint:** Do NOT update the Sitemap reference in `public/robots.txt` until Task 1 build output is physically verified. The new filenames are inferred from docs but must be confirmed against `dist/`.

## Known Bugs Being Fixed

| File                          | Bug                                                  |
| ----------------------------- | ---------------------------------------------------- |
| `public/manifest.webmanifest` | `theme_color: "#FFFFFF"` — must be `#206D03`         |
| `public/manifest.webmanifest` | `background_color: "#FFFFFF"` — must be `#1A1A1A`    |
| `public/browserconfig.xml`    | `<TileColor>#FFFFFF</TileColor>` — must be `#206D03` |

## Files Touched

| Task | File                          | Action                         |
| ---- | ----------------------------- | ------------------------------ |
| 1    | `astro.config.mjs`            | Modify — configure `sitemap()` |
| 2    | `public/robots.txt`           | Rewrite                        |
| 3    | `public/manifest.webmanifest` | Rewrite                        |
| 4    | `src/components/Head.astro`   | Modify — add 4 meta tags       |
| 4    | `public/browserconfig.xml`    | Modify — fix TileColor         |

---

## Task 1: Configure @astrojs/sitemap (filenameBase + chunks + serialize + filter)

**Files:**

- Modify: `astro.config.mjs`

### Step 1: Read current sitemap config

Open `astro.config.mjs`. Current state:

```js
sitemap(),
```

Confirm it has no options. The integration is imported as `import sitemap from "@astrojs/sitemap";` at the top.

### Step 2: Replace sitemap() call with full config

In `astro.config.mjs`, replace:

```js
sitemap(),
```

With:

```js
sitemap({
  // Rename sitemap files — forces Google to read as new, cleans GSC history
  // Generates: fmt-sitemap-index.xml + fmt-sitemap-products-0.xml + fmt-sitemap-pages-0.xml
  filenameBase: "fmt-sitemap",

  // Exclude 404 — noindex page must not appear in sitemap
  filter: (page) => !page.endsWith("/404/") && !page.endsWith("/404"),

  // Split by content type — allows Google to prioritize crawl budget per section
  chunks: {
    products: (item) => {
      if (item.url.includes("/products/")) {
        item.lastmod = new Date();
        return item;
      }
    },
  },

  // Add lastmod to all pages (Google uses this to detect content changes)
  // Note: changefreq and priority are officially ignored by Google — omitted intentionally
  serialize(item) {
    item.lastmod = new Date();
    return item;
  },
}),
```

### Step 3: Build and verify output filenames

Run:

```bash
pnpm build 2>&1 | grep -E "sitemap|error|Error"
```

Expected output includes:

```
[@astrojs/sitemap] `fmt-sitemap-index.xml` created at `dist`
```

Then verify exact files in dist:

```bash
ls dist/ | grep sitemap
```

Expected output (confirm these exact names before proceeding):

```
fmt-sitemap-0.xml         ← or fmt-sitemap-pages-0.xml
fmt-sitemap-index.xml
fmt-sitemap-products-0.xml
```

**If the filenames differ from expected:** Document the actual names before continuing. Task 2 (robots.txt) uses the index filename — it must match reality.

### Step 4: Inspect sitemap content

```bash
cat dist/fmt-sitemap-index.xml
```

Confirm it points to the correct child sitemap URLs.

```bash
cat dist/fmt-sitemap-products-0.xml | grep -c "<url>"
```

Expected: `47` (all product pages)

```bash
# Count content pages (whichever file is not products)
cat dist/fmt-sitemap-pages-0.xml | grep -c "<url>" 2>/dev/null || \
cat dist/fmt-sitemap-0.xml | grep -c "<url>"
```

Expected: `17` (all content pages, no /404)

Spot-check lastmod is present:

```bash
cat dist/fmt-sitemap-products-0.xml | grep "lastmod" | head -3
```

Expected: `<lastmod>2026-02-21T...</lastmod>` entries present.

### Step 5: Commit

```bash
git add astro.config.mjs
git commit -m "feat(sitemap): rename to fmt-sitemap, split products/pages chunks, add lastmod"
```

---

## Task 2: Rewrite robots.txt

**Files:**

- Rewrite: `public/robots.txt`

**Prerequisite:** Task 1 Step 3 must be complete. Confirm the exact index sitemap filename before writing the Sitemap directive.

### Step 1: Write the new robots.txt

Replace the entire content of `public/robots.txt` with:

```
# =============================================================
# robots.txt — forestal-mt.com
# Policy: Allow search engines + AI referral/search crawlers
#          Block AI training scrapers + unknown bots
# Last updated: 2026-02-21
# Reference: https://developers.cloudflare.com/ai-crawl-control/reference/bots/
# =============================================================

# Default: all standard crawlers allowed, 404 excluded
User-agent: *
Disallow: /404
Allow: /

Sitemap: https://forestal-mt.com/fmt-sitemap-index.xml

# =============================================================
# SEARCH ENGINES — ALLOWED
# Core SEO. Blocking these = site does not rank.
# =============================================================

User-agent: Googlebot
Allow: /

# Note: BingBot UA string is lowercase "bingbot" per Cloudflare reference
User-agent: bingbot
Allow: /

# =============================================================
# AI SEARCH BOTS — ALLOWED
# These index content for AI-powered search results.
# They generate referral traffic when users click through.
# =============================================================

# OpenAI ChatGPT Search index
User-agent: OAI-SearchBot
Allow: /

# Perplexity search index (~90M MAU, growing referral source)
User-agent: PerplexityBot
Allow: /

# Anthropic Claude Search index
User-agent: Claude-SearchBot
Allow: /

# Apple Siri, Spotlight, Apple Maps — search + referral
User-agent: Applebot
Allow: /

# Google AI Overviews (formerly SGE) — blocking = removed from AI snippets in SERP
User-agent: Google-Extended
Allow: /

# =============================================================
# AI ASSISTANTS — ALLOWED
# These fetch URLs on-demand when a user explicitly requests
# your page via an AI chat interface. Pure referral value.
# =============================================================

# OpenAI ChatGPT live browsing
User-agent: ChatGPT-User
Allow: /

# Perplexity live browsing
User-agent: Perplexity-User
Allow: /

# Anthropic Claude live browsing
User-agent: Claude-User
Allow: /

# DuckDuckGo AI Answer
User-agent: DuckAssistBot
Allow: /

# Meta AI live fetching (WhatsApp, Threads, Instagram AI features)
User-agent: meta-externalfetcher
Allow: /

# Mistral AI live browsing
User-agent: MistralAI-User
Allow: /

# =============================================================
# SOCIAL CRAWLERS — ALLOWED
# These fetch OG tags for link previews in social platforms.
# Blocking breaks WhatsApp/IG/Threads/Facebook link previews.
# =============================================================

# Meta OG crawler — Facebook, Instagram, Threads, WhatsApp link previews
User-agent: FacebookBot
Allow: /

# Meta external agent — also used for social platform features
# Allowed despite AI Crawler categorization: blocks WhatsApp/IG/Threads previews
User-agent: meta-externalagent
Allow: /

# =============================================================
# AI TRAINING CRAWLERS — BLOCKED
# These scrape content to train LLM models. No referral value.
# Separate crawlers exist for search/referral (allowed above).
# =============================================================

# OpenAI model training (separate from OAI-SearchBot and ChatGPT-User)
User-agent: GPTBot
Disallow: /

# Anthropic model training (separate from Claude-SearchBot and Claude-User)
User-agent: ClaudeBot
Disallow: /

# Common Crawl — the primary training dataset used by most LLMs (C4, The Pile, ROOTS)
User-agent: CCBot
Disallow: /

# ByteDance / TikTok AI training
User-agent: Bytespider
Disallow: /

# Amazon Alexa / Amazon AI training
User-agent: Amazonbot
Disallow: /

# Google Vertex AI training (separate from Googlebot and Google-Extended)
User-agent: Google-CloudVertexBot
Disallow: /

# Huawei Petal Search — no relevant market overlap, aggressive crawler
User-agent: PetalBot
Disallow: /

# Internet Archive — controls public history of live business pages
User-agent: archive.org_bot
Disallow: /

# =============================================================
# UNKNOWN / UNVERIFIED BOTS — BLOCKED
# Not in Cloudflare's verified reference. UA may be spoofed.
# Real enforcement: Cloudflare AI Crawl Control → Block in dashboard.
# =============================================================

User-agent: Timpibot
Disallow: /

User-agent: Novellum AI Crawl
Disallow: /

User-agent: ProRataBot
Disallow: /

User-agent: Terracotta Bot
Disallow: /

User-agent: ManusBot
Disallow: /

User-agent: AnchorBot
Disallow: /
```

### Step 2: Verify the file size

```bash
wc -c public/robots.txt
```

Expected: > 2000 bytes (versus previous 75 bytes). GSC will show the size increase as confirmation it fetched the new version.

### Step 3: Build to confirm robots.txt copies to dist

```bash
pnpm build 2>&1 | tail -5
cat dist/robots.txt | grep "Sitemap:"
```

Expected:

```
Sitemap: https://forestal-mt.com/fmt-sitemap-index.xml
```

### Step 4: Commit

```bash
git add public/robots.txt
git commit -m "feat(robots): complete AI crawler policy — allow referral, block training"
```

---

## Task 3: Fix manifest.webmanifest

**Files:**

- Rewrite: `public/manifest.webmanifest`

### Step 1: Verify existing icons in public/

Before writing, confirm all icons referenced in the new manifest actually exist:

```bash
ls public/ | grep -E "favicon|android|apple"
```

Expected (all must be present):

```
android-chrome-192x192.png
android-chrome-512x512.png
apple-touch-icon.png
favicon-16x16.png
favicon-32x32.png
favicon-48x48.png
```

If any are missing, stop and report before continuing.

### Step 2: Rewrite manifest.webmanifest

Replace entire content of `public/manifest.webmanifest`:

```json
{
  "name": "Forestal MT",
  "short_name": "Forestal MT",
  "description": "Honduran exporter of Batana Oil, Jimerito Honey & wildcrafted traditional herbs. Direct-sourced from indigenous communities. Ships worldwide — wholesale & retail.",
  "lang": "en",
  "display": "standalone",
  "orientation": "portrait",
  "scope": "/",
  "start_url": "/",
  "categories": ["shopping", "health"],
  "theme_color": "#206D03",
  "background_color": "#1A1A1A",
  "icons": [
    {
      "src": "/favicon-16x16.png",
      "sizes": "16x16",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon-32x32.png",
      "sizes": "32x32",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/favicon-48x48.png",
      "sizes": "48x48",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/apple-touch-icon.png",
      "sizes": "180x180",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/android-chrome-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/android-chrome-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### Step 3: Verify build copies manifest correctly

```bash
pnpm build 2>&1 | tail -3
cat dist/manifest.webmanifest | python3 -m json.tool | grep -E "theme_color|background_color|lang"
```

Expected:

```json
"background_color": "#1A1A1A",
"lang": "en",
"theme_color": "#206D03",
```

### Step 4: Commit

```bash
git add public/manifest.webmanifest
git commit -m "fix(pwa): correct theme_color/background_color, add lang, expand icon set"
```

---

## Task 4: Fix Head.astro + browserconfig.xml

**Files:**

- Modify: `src/components/Head.astro:87-91` (after `<link rel="manifest">`)
- Modify: `public/browserconfig.xml`

### Step 1: Read Head.astro to locate insertion point

Open `src/components/Head.astro`. Find this block (around line 87-91):

```astro
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#206D03" />
<meta name="msapplication-TileColor" content="#206D03" />
<meta name="theme-color" content="#206D03" />
```

### Step 2: Add Apple PWA meta tags + msapplication-config

Insert 4 new lines immediately after `<link rel="manifest" href="/manifest.webmanifest" />`:

```astro
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<link rel="manifest" href="/manifest.webmanifest" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Forestal MT" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="msapplication-config" content="/browserconfig.xml" />
<link rel="mask-icon" href="/safari-pinned-tab.svg" color="#206D03" />
<meta name="msapplication-TileColor" content="#206D03" />
<meta name="theme-color" content="#206D03" />
```

Why each tag:

- `apple-mobile-web-app-capable`: enables standalone mode on iOS homescreen. Without it, iOS opens your site in Safari even when installed.
- `apple-mobile-web-app-title`: short name under the icon on iOS. Without it, iOS uses the full `<title>` tag which can be long and truncates badly.
- `apple-mobile-web-app-status-bar-style`: controls iOS status bar appearance in standalone mode. `"default"` = translucent grey, compatible with green theme.
- `msapplication-config`: tells IE/Edge legacy where to find tile config. Without it, Windows tiles use fallback behavior.

### Step 3: Fix browserconfig.xml

Read `public/browserconfig.xml`. It currently contains:

```xml
<TileColor>#FFFFFF</TileColor>
```

Change to:

```xml
<TileColor>#206D03</TileColor>
```

This must match `<meta name="msapplication-TileColor" content="#206D03">` in Head.astro. Currently they conflict.

### Step 4: Build and spot-check rendered HTML

```bash
pnpm build 2>&1 | tail -3
```

Then check the homepage HTML for the new meta tags:

```bash
grep -A1 "apple-mobile-web-app" dist/index.html
```

Expected:

```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-title" content="Forestal MT" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
```

Check browserconfig fix:

```bash
cat dist/browserconfig.xml | grep TileColor
```

Expected:

```xml
<TileColor>#206D03</TileColor>
```

### Step 5: Run lint + type check

```bash
pnpm lint && pnpm check
```

Expected: 0 errors.

### Step 6: Commit

```bash
git add src/components/Head.astro public/browserconfig.xml
git commit -m "fix(pwa): add Apple PWA meta tags, link browserconfig, fix TileColor to brand green"
```

---

## Task 5: Final verification and PR prep

### Step 1: Full clean build

```bash
pnpm build 2>&1 | grep -E "error|Error|warning|sitemap|Complete"
```

Expected: No errors. Sitemap line confirms new filename.

### Step 2: Verify all 5 modified files are committed

```bash
git log --oneline -5
```

Expected: 4 commits from this session visible.

```bash
git status
```

Expected: `nothing to commit, working tree clean`

### Step 3: Verify dist output checklist

```bash
# Sitemap index exists with new name
ls dist/ | grep fmt-sitemap

# robots.txt references new sitemap
grep "Sitemap:" dist/robots.txt

# manifest has correct theme color
cat dist/manifest.webmanifest | grep theme_color

# browserconfig has brand green
cat dist/browserconfig.xml | grep TileColor

# Head.astro rendered correctly (spot check)
grep "apple-mobile-web-app-capable" dist/index.html
grep "msapplication-config" dist/index.html
```

All checks must pass before creating the PR.

### Step 4: Push branch

```bash
git push -u origin feature/seo-crawling
```

### Step 5: Invoke finishing-a-development-branch skill

Use `superpowers:finishing-a-development-branch` to decide merge/PR strategy.

---

## Manual Steps Post-Deploy (not code — Nery does these)

**Google Search Console** (after deploy to production):

1. `Sitemaps` → remove all previous sitemaps listed in history
2. `Sitemaps` → add `https://forestal-mt.com/fmt-sitemap-index.xml`
3. `URL Inspection` → enter `https://forestal-mt.com/` → Request Indexing
4. Wait 48–72h for GSC to show the 3 new sitemaps processed

**Cloudflare AI Crawl Control** (Zone: forestal-mt.com → AI Crawl Control → Crawlers):
Block individually (these have unverified UAs — robots.txt alone is insufficient):

- Manus Bot
- Novellum AI Crawl
- ProRataInc
- Terracotta Bot
- Timpibot
- Anchor Browser

---

## Known Limitations / Future Work

- **Sitemap filenameBase + chunks naming:** Exact filenames of chunk files when combined with `filenameBase` must be verified in Task 1 Step 3. If they differ from expected, adjust robots.txt Sitemap directive accordingly before committing.
- **PWA Screenshots:** `screenshots` field in manifest improves the Chrome install prompt. Deferred — requires actual 1280×800 desktop + 390×844 mobile screenshots of the live site.
- **`archive.org_bot` decision:** Currently blocked. Reversible if Nery wants Wayback Machine archival for brand credibility.
- **Pay Per Crawl (Cloudflare):** In private beta. Monitor — could generate revenue from AI crawlers accessing content.
