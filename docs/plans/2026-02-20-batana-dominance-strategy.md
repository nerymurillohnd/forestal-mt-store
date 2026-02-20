# Batana Dominance Strategy — Performance + Conversion + SEO

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 concrete technical gaps that cost LCP score, mobile payload, and wholesale conversion — plus standardize image format across the site.

**Architecture:**

- LCP: Add `preloadHints` prop to `Head.astro`. Pages compute the hero poster/image URL and pass it in. Preload emits in `<head>`, before hero renders.
- AVIF: `cdnImage()` already defaults to `format=auto` (AVIF auto-negotiation via Accept header). Only 5 hard-coded `format=webp` strings remain — replace them all.
- Wholesale: Replace the static green box in `AudienceWholesaleSplit.astro` with `WholesaleMapIsland.tsx` — an animated SVG world map with Honduras → 7 regions flight paths.
- SEO/AI Search: Dedicated follow-up session after performance work lands. Not in this plan.

**Tech Stack:** Astro 5 SSG, Preact islands, Cloudflare Image Resizing, Cloudflare Stream (HLS), `src/lib/image.ts`, `src/data/stream-videos.ts`

---

## Scope Boundaries

**IN scope:**

- Task 1: `<link rel="preload">` for hero poster (4 video pages) and hero image (image-bg pages)
- Task 2: Replace 5 hard-coded `format=webp` with `format=auto`
- Task 3: `WholesaleMapIsland.tsx` — animated SVG world map, replaces static green box

**OUT of scope (separate session):**

- SEO/AI Search structured data depth — invoke `seo-expert` skill in a new session
- Placeholder reviews in `batana-oil/index.astro` — needs real customer copy
- `man-batana-daily-care-routine.jpg` integration — design decision needed

---

## Context: File Map

| File                                          | Role                                                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `src/components/Head.astro`                   | Emits `<head>` content. No preload hints today.                                                                              |
| `src/components/Hero.astro`                   | Renders hero section. Computes `posterSrc` and `hlsSrc` locally — never exposes them.                                        |
| `src/components/AudienceWholesaleSplit.astro` | 2-col section used on 3 catalog pages (batana-oil, stingless-bee-honey, traditional-herbs). Right column = static green box. |
| `src/lib/image.ts`                            | `cdnImage()`, `cdnSrcSet()`, `cdnPicture()`. Default: `format=auto`.                                                         |
| `src/data/stream-videos.ts`                   | `getStreamPoster(uid, w, h)` → poster URL from Cloudflare Stream.                                                            |
| `src/pages/batana-oil/index.astro`            | Uses `<Hero>` with `background.type: "video"`.                                                                               |
| `src/pages/stingless-bee-honey/index.astro`   | Uses `<Hero>` with `background.type: "video"`.                                                                               |
| `src/pages/traditional-herbs/index.astro`     | Uses `<Hero>` with `background.type: "video"`.                                                                               |
| `src/pages/index.astro`                       | Home page. Uses `<Hero>` with `background.type: "video"`.                                                                    |
| `src/components/islands/HerbScrollIsland.tsx` | Hard-coded `format=webp` at line 150.                                                                                        |
| `src/pages/products/index.astro`              | Hard-coded `format=webp` at line 141.                                                                                        |
| `src/pages/products/[handler].astro`          | Hard-coded `format=webp` at line 165.                                                                                        |
| `src/pages/batana-oil/index.astro`            | Hard-coded `format=webp` at line 597.                                                                                        |
| `src/pages/stingless-bee-honey/index.astro`   | Hard-coded `format=webp` at line 250.                                                                                        |

---

## Task 1: LCP Preload — `Head.astro` + 4 hero pages

### Why this matters

LCP on all 4 video-hero pages (home, batana-oil, stingless-bee-honey, traditional-herbs) is the Cloudflare Stream poster image. The poster renders as the visible hero before the video loads. Without a `<link rel="preload">`, the browser discovers the poster only when it parses the `<video poster="">` attribute — which is after CSS, fonts, and blocking JS. This is a guaranteed Lighthouse penalty.

On image-hero pages (about, batana-oil if using image fallback), the hero `<img loading="eager">` is LCP but has no preload either.

**Files to modify:**

- `src/components/Head.astro`
- `src/pages/index.astro`
- `src/pages/batana-oil/index.astro`
- `src/pages/stingless-bee-honey/index.astro`
- `src/pages/traditional-herbs/index.astro`

**Files to read first:**

- `src/data/stream-videos.ts` (to get `getStreamPoster` signature)
- Each of the 4 page files (to see how they import `Hero` and where `Head` is called)

---

### Step 1.1: Read `src/data/stream-videos.ts` — confirm `getStreamPoster` signature

Run: `cat src/data/stream-videos.ts`
Expected: `getStreamPoster(uid: string, width: number, height: number): string`
Poster URL pattern: `https://customer-8w5s9dekjdinwesc.cloudflarestream.com/{uid}/thumbnails/thumbnail.jpg?width=1920&height=1080&fit=cover`

---

### Step 1.2: Add `preloadHints` prop to `Head.astro`

**Modify:** `src/components/Head.astro`

Add to the `Props` interface (after `twitter`):

```ts
preloadHints?: Array<{
  href: string;
  as: "image" | "video" | "font" | "script" | "style";
  type?: string;
  crossorigin?: boolean;
  imagesrcset?: string;
  imagesizes?: string;
}>;
```

Add to destructuring:

```ts
const { ..., preloadHints = [] } = Astro.props;
```

Add to the HTML output, immediately after `<meta charset="utf-8" />`:

```html
{preloadHints.map((hint) => (
  <link
    rel="preload"
    href={hint.href}
    as={hint.as}
    type={hint.type}
    crossorigin={hint.crossorigin ? "" : undefined}
    imagesrcset={hint.imagesrcset}
    imagesizes={hint.imagesizes}
  />
))}
```

---

### Step 1.3: Add preload to `src/pages/index.astro` (home)

Read the file first to see how `Head` is called and where frontmatter data comes from.

Home page uses `background.type: "video"` with stream UID `2baff6ee682afbfae617fd25ed2b0209`.

At the top of the frontmatter script, import `getStreamPoster`:

```ts
import { getStreamPoster } from "../data/stream-videos";
```

Compute the poster URL before the `<Head>` call:

```ts
const heroPosterSrc =
  data.hero.background?.type === "video"
    ? getStreamPoster(data.hero.background.stream, 1920, 1080)
    : null;
```

Pass to `<Head>`:

```astro
<Head
  ...existing
  props...
  preloadHints={heroPosterSrc ? [{ href: heroPosterSrc, as: "image" }] : []}
/>
```

---

### Step 1.4: Add preload to `src/pages/batana-oil/index.astro`

Same pattern. Stream UID: `709312413ff576260a7596e37d4d5c97`.

Read the file — find where `<Head>` is called. The page imports from frontmatter `data.hero.background`.

Add import + compute `heroPosterSrc` + pass `preloadHints` to `<Head>`.

---

### Step 1.5: Add preload to `src/pages/stingless-bee-honey/index.astro`

Same pattern. Stream UID: `d26fac9cccc86e666b136d952c1ea413`.

---

### Step 1.6: Add preload to `src/pages/traditional-herbs/index.astro`

Same pattern. Stream UID: `7dc57c8cc048bb7a7ac5e5f2aefb1eb0`.

---

### Step 1.7: Run build and verify preload tags appear

```bash
pnpm build 2>&1 | tail -20
```

Expected: Build completes with no errors.

Then grep the output HTML to confirm preload tags:

```bash
grep -r 'rel="preload"' dist/ | head -20
```

Expected: 4 lines matching `thumbnail.jpg` in `index.html`, `batana-oil/index.html`, `stingless-bee-honey/index.html`, `traditional-herbs/index.html`.

---

### Step 1.8: Commit

```bash
git add src/components/Head.astro src/pages/index.astro src/pages/batana-oil/index.astro src/pages/stingless-bee-honey/index.astro src/pages/traditional-herbs/index.astro
git commit -m "perf: add LCP preload hints for hero poster and image — 4 video pages"
```

---

## Task 2: Standardize Image Format — Replace `format=webp` with `format=auto`

### Why this matters

`cdnImage()` already defaults to `format=auto`, which tells Cloudflare to serve AVIF to clients that send `Accept: image/avif` (Chrome, Edge, Firefox, Safari 16+). Mobile Chrome in particular benefits most — AVIF averages ~30% smaller than WebP at equivalent quality. Five places in the codebase bypass this by hard-coding `format=webp`.

**Files to modify:**

1. `src/components/islands/HerbScrollIsland.tsx` (line ~150)
2. `src/pages/products/index.astro` (line ~141)
3. `src/pages/products/[handler].astro` (line ~165)
4. `src/pages/batana-oil/index.astro` (line ~597)
5. `src/pages/stingless-bee-honey/index.astro` (line ~250)

---

### Step 2.1: Fix `HerbScrollIsland.tsx`

Read `src/components/islands/HerbScrollIsland.tsx` around line 150.

Current:

```ts
src={`/cdn-cgi/image/width=280,format=webp/${herb.image}`}
```

Replace with:

```ts
src={`/cdn-cgi/image/width=280,format=auto/${herb.image}`}
```

Note: This file uses raw URL construction, not `cdnImage()`. Do NOT refactor to use `cdnImage()` — that would be unnecessary scope. Just swap `format=webp` → `format=auto`.

---

### Step 2.2: Fix `products/index.astro`

Read around line 141.

Current:

```ts
src={`/cdn-cgi/image/width=400,format=webp/${m?.image.url ?? ""}`}
```

Replace:

```ts
src={`/cdn-cgi/image/width=400,format=auto/${m?.image.url ?? ""}`}
```

---

### Step 2.3: Fix `products/[handler].astro`

Read around line 165.

Current:

```ts
src={`/cdn-cgi/image/width=800,format=webp/${media.image.url}`}
```

Replace:

```ts
src={`/cdn-cgi/image/width=800,format=auto/${media.image.url}`}
```

---

### Step 2.4: Fix `batana-oil/index.astro`

Read around line 597.

Current:

```ts
src={`/cdn-cgi/image/width=400,format=webp/${mediaMap.get(product.handler)}`}
```

Replace:

```ts
src={`/cdn-cgi/image/width=400,format=auto/${mediaMap.get(product.handler)}`}
```

---

### Step 2.5: Fix `stingless-bee-honey/index.astro`

Read around line 250.

Current:

```ts
src =
  "/cdn-cgi/image/width=600,format=webp/https://cdn.forestal-mt.com/products/productGroup/jimerito.png";
```

Replace:

```ts
src =
  "/cdn-cgi/image/width=600,format=auto/https://cdn.forestal-mt.com/products/productGroup/jimerito.png";
```

---

### Step 2.6: Verify no `format=webp` strings remain (except in docs/comments)

```bash
grep -r 'format=webp' src/ --include="*.astro" --include="*.tsx" --include="*.ts"
```

Expected: Zero matches (the only `format=webp` mentions should be in `src/lib/image.ts` as JSDoc examples, which is fine).

---

### Step 2.7: Run build

```bash
pnpm build 2>&1 | tail -20
```

Expected: No errors.

---

### Step 2.8: Commit

```bash
git add src/components/islands/HerbScrollIsland.tsx src/pages/products/index.astro "src/pages/products/[handler].astro" src/pages/batana-oil/index.astro src/pages/stingless-bee-honey/index.astro
git commit -m "perf: replace format=webp with format=auto — 5 files, enables AVIF on supporting clients"
```

---

## Task 3: Animated Wholesale Map Island

### Why this matters

The `AudienceWholesaleSplit` wholesale box is a static green panel — it does nothing. For B2B buyers (the primary conversion target for this section), nothing communicates "global supply chain reach" better than a live visual of Honduras → 7 destination regions. The animated flight paths make the supply story tangible and build credibility.

**Files to create:**

- `src/components/islands/WholesaleMapIsland.tsx`

**Files to modify:**

- `src/components/AudienceWholesaleSplit.astro`

---

### Step 3.1: Design the island

The island replaces the static green box. It must:

1. Render a simplified SVG world map (equirectangular projection — static SVG paths, no external library)
2. Mark Honduras with a pulsing amber dot (origin)
3. Mark 7 destination regions with smaller green dots: North America, Latin America, Europe, Middle East, Africa, Asia Pacific, Australia
4. Animate curved flight paths from Honduras to each region (SVG `<path>` with `stroke-dashoffset` CSS animation)
5. Show region labels on hover (or always-visible on desktop)
6. Preserve the eyebrow, heading, body text, and CTA button from the current green box
7. Background: dark green (`#0d3311`) with subtle radial glow at Honduras origin
8. `client:visible` hydration — don't load until the section scrolls into view
9. Respect `prefers-reduced-motion` — if set, skip path animations, show static dots only

**Coordinate map (approximate SVG viewBox 0 0 1000 500):**

| Region            | cx  | cy  | Label         |
| ----------------- | --- | --- | ------------- |
| Honduras (origin) | 205 | 240 | Honduras      |
| North America     | 165 | 170 | North America |
| Latin America     | 230 | 310 | Latin America |
| Europe            | 470 | 140 | Europe        |
| Middle East       | 555 | 205 | Middle East   |
| Africa            | 490 | 280 | Africa        |
| Asia Pacific      | 730 | 230 | Asia Pacific  |
| Australia         | 760 | 370 | Australia     |

**Animation sequence:**

- Paths animate in staggered order (delay: 0ms, 300ms, 600ms, 900ms, 1200ms, 1500ms, 1800ms)
- Each path: 800ms ease-out, `stroke-dashoffset` from full length → 0
- Dots pulse (scale 1 → 1.3 → 1) at the end of their path animation
- Loop: paths fade out at 4000ms, restart at 5000ms

---

### Step 3.2: Write the island

**Create:** `src/components/islands/WholesaleMapIsland.tsx`

```tsx
/**
 * WholesaleMapIsland — Animated SVG world map with Honduras → 7 regions flight paths.
 * Replaces the static green box in AudienceWholesaleSplit.
 * Hydrates: client:visible
 */
import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  eyebrow?: string;
  heading?: string;
  body: string;
  cta?: string;
}

const ORIGIN = { cx: 205, cy: 240 };
const DESTINATIONS = [
  { id: "north-america", cx: 155, cy: 165, label: "North America" },
  { id: "latin-america", cx: 235, cy: 315, label: "Latin America" },
  { id: "europe", cx: 472, cy: 138, label: "Europe" },
  { id: "middle-east", cx: 558, cy: 208, label: "Middle East" },
  { id: "africa", cx: 488, cy: 285, label: "Africa" },
  { id: "asia-pacific", cx: 732, cy: 228, label: "Asia Pacific" },
  { id: "australia", cx: 762, cy: 370, label: "Australia" },
];

/** Bezier control point: arc upward between two points */
function arcPath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  const my = Math.min(y1, y2) - Math.abs(x2 - x1) * 0.22;
  return `M${x1},${y1} Q${mx},${my} ${x2},${y2}`;
}

export default function WholesaleMapIsland({
  eyebrow = "Wholesale & Global Supply",
  heading = "Partner With the Source",
  body,
  cta = "Request a Quote",
}: Props) {
  const [active, setActive] = useState<string | null>(null);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (prefersReduced) return;
    // Restart animation cycle every 6 seconds
    const timer = setInterval(() => setCycle((c) => c + 1), 6000);
    return () => clearInterval(timer);
  }, [prefersReduced]);

  return (
    <div class="flex flex-col rounded-[2px] overflow-hidden" style="background:#0a2b0d;">
      {/* SVG world map */}
      <div class="relative w-full" style="padding-top: 50%;">
        <svg viewBox="0 0 1000 500" class="absolute inset-0 w-full h-full" aria-hidden="true">
          {/* Simplified world landmass silhouette — inline path data */}
          <WorldMap />

          {/* Radial glow at Honduras */}
          <radialGradient id="origin-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#F3C00D" stop-opacity="0.35" />
            <stop offset="100%" stop-color="#F3C00D" stop-opacity="0" />
          </radialGradient>
          <ellipse cx={ORIGIN.cx} cy={ORIGIN.cy} rx={60} ry={40} fill="url(#origin-glow)" />

          {/* Flight paths */}
          {!prefersReduced &&
            DESTINATIONS.map((dest, i) => {
              const d = arcPath(ORIGIN.cx, ORIGIN.cy, dest.cx, dest.cy);
              const delay = i * 300;
              return (
                <path
                  key={`${dest.id}-${cycle}`}
                  d={d}
                  fill="none"
                  stroke="#F3C00D"
                  stroke-width="1"
                  stroke-opacity="0.55"
                  stroke-linecap="round"
                  style={`
                    stroke-dasharray: 600;
                    stroke-dashoffset: 600;
                    animation: drawPath 800ms ease-out ${delay}ms forwards;
                  `}
                />
              );
            })}

          {/* Destination dots */}
          {DESTINATIONS.map((dest, i) => (
            <g
              key={dest.id}
              onMouseEnter={() => setActive(dest.id)}
              onMouseLeave={() => setActive(null)}
              style="cursor:default"
            >
              <circle
                cx={dest.cx}
                cy={dest.cy}
                r={5}
                fill="#206D03"
                stroke="#54B006"
                stroke-width="1.5"
                style={
                  !prefersReduced
                    ? `animation: dotPulse 600ms ease-out ${i * 300 + 900}ms both;`
                    : ""
                }
              />
              {active === dest.id && (
                <text
                  x={dest.cx}
                  y={dest.cy - 10}
                  text-anchor="middle"
                  fill="white"
                  font-size="10"
                  font-family="var(--font-ui)"
                  style="pointer-events:none"
                >
                  {dest.label}
                </text>
              )}
            </g>
          ))}

          {/* Honduras origin dot */}
          <circle
            cx={ORIGIN.cx}
            cy={ORIGIN.cy}
            r={7}
            fill="#F3C00D"
            stroke="#A18500"
            stroke-width="1.5"
          />
          <text
            x={ORIGIN.cx}
            y={ORIGIN.cy + 18}
            text-anchor="middle"
            fill="#F3C00D"
            font-size="8"
            font-family="var(--font-ui)"
            letter-spacing="0.08em"
          >
            HONDURAS
          </text>

          <style>{`
            @keyframes drawPath {
              to { stroke-dashoffset: 0; }
            }
            @keyframes dotPulse {
              0% { r: 5; opacity: 0; }
              60% { r: 7; opacity: 1; }
              100% { r: 5; opacity: 1; }
            }
          `}</style>
        </svg>
      </div>

      {/* Text content block */}
      <div class="p-8 text-center flex flex-col items-center gap-4">
        <p class="font-[family-name:var(--font-heading)] text-[10px] uppercase tracking-[0.35em] text-[#F3C00D]/80">
          {eyebrow}
        </p>
        <h3 class="font-[family-name:var(--font-display)] text-[1.4rem] text-white leading-tight">
          {heading}
        </h3>
        <p class="font-[family-name:var(--font-body)] text-[13px] leading-relaxed text-white/60 max-w-xs">
          {body}
        </p>
        <a
          href="/wholesale/"
          class="mt-2 inline-block rounded-[3px] bg-[#F3C00D] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[13px] font-semibold text-[#333] transition-all duration-300 hover:bg-[#F3C00D]/90"
        >
          {cta}
        </a>
      </div>
    </div>
  );
}

/**
 * WorldMap — simplified SVG landmass paths (equirectangular, 1000×500 viewBox).
 * Low-detail silhouette sufficient for visual context.
 */
function WorldMap() {
  return (
    <g fill="#1a4a1e" stroke="none" opacity="0.7">
      {/* North America */}
      <path d="M80,80 L220,75 L240,100 L250,130 L230,160 L200,180 L185,210 L170,225 L145,230 L120,215 L100,200 L80,180 L70,150 L65,120 Z" />
      {/* Central America + Caribbean approx */}
      <path d="M185,210 L200,215 L210,235 L200,248 L185,240 Z" />
      {/* South America */}
      <path d="M190,255 L250,245 L290,265 L310,310 L305,360 L280,400 L250,420 L220,415 L200,390 L190,350 L185,300 Z" />
      {/* Europe */}
      <path d="M420,80 L510,75 L530,100 L520,130 L490,145 L460,140 L440,120 L420,100 Z" />
      {/* Africa */}
      <path d="M440,155 L520,150 L560,170 L570,220 L560,275 L540,315 L510,335 L480,330 L455,305 L445,260 L440,205 Z" />
      {/* Middle East */}
      <path d="M520,155 L580,150 L605,175 L600,210 L570,220 L540,210 Z" />
      {/* Asia (simplified) */}
      <path d="M560,70 L800,65 L840,100 L850,150 L820,185 L760,200 L700,195 L650,185 L610,175 L580,155 L560,120 Z" />
      {/* Southeast Asia */}
      <path d="M710,200 L760,195 L780,220 L760,245 L725,240 L700,225 Z" />
      {/* Australia */}
      <path d="M720,330 L820,320 L860,345 L860,395 L830,415 L780,420 L740,405 L715,380 L715,350 Z" />
      {/* New Zealand approx */}
      <path d="M880,380 L895,365 L900,385 L890,400 Z" />
    </g>
  );
}
```

---

### Step 3.3: Run build and check for TypeScript errors

```bash
pnpm check 2>&1 | tail -30
pnpm build 2>&1 | tail -20
```

Expected: No TypeScript errors, build succeeds.

If there are TSX/Preact JSX errors on SVG attributes (e.g. `stroke-width`, `stop-color` — SVG uses kebab-case, Preact accepts both):

- Use camelCase alternatives: `strokeWidth`, `stopColor`, `stopOpacity`, `strokeOpacity`, `strokeDasharray`, `strokeDashoffset`, `strokeLinecap`, `textAnchor`, `letterSpacing`, `fontSize`, `fontFamily`, `fontWeight`

---

### Step 3.4: Modify `AudienceWholesaleSplit.astro`

**Current right column (lines ~54-79):**

```astro
<div
  class="flex flex-col justify-center rounded-[2px] bg-leaf-green p-12 text-center reveal-on-scroll"
>
  ...static green box...
</div>
```

**Replace entire right column div with:**

```astro
import WholesaleMapIsland from "./islands/WholesaleMapIsland";

<div class="reveal-on-scroll">
  <WholesaleMapIsland
    client:visible
    eyebrow={wholesaleEyebrow}
    heading={wholesaleHeading}
    body={wholesaleBody}
    cta={wholesaleCta}
  />
</div>
```

Add the import at the top of the frontmatter section.

---

### Step 3.5: Build and verify — no regressions on 3 catalog pages

```bash
pnpm build 2>&1 | tail -20
```

Expected: Build succeeds. The 3 pages using `AudienceWholesaleSplit` (batana-oil, stingless-bee-honey, traditional-herbs) should all build without error.

Optionally run dev and visit `http://localhost:4321/batana-oil/` to visually confirm the map appears and paths animate.

```bash
pnpm dev
```

---

### Step 3.6: Commit

```bash
git add src/components/islands/WholesaleMapIsland.tsx src/components/AudienceWholesaleSplit.astro
git commit -m "feat: animated wholesale world map island — Honduras origin flight paths to 7 regions"
```

---

## Task 4: Final push

### Step 4.1: Run full quality suite

```bash
pnpm format && pnpm lint && pnpm check && pnpm build
```

Expected: All pass. Build output: 64 pages.

---

### Step 4.2: Push to origin

```bash
git push origin main
```

Expected: GH Actions CI pipeline triggers. Stages: Lint → Build → E2E → Lighthouse → Deploy → Lighthouse-prod.

---

## Verification Checklist

After CI passes:

- [ ] Live site: view-source on `/batana-oil/` — `<link rel="preload">` for Stream poster URL present in `<head>`
- [ ] Live site: view-source on `/` (home) — same preload present
- [ ] Live site: DevTools Network tab on `/traditional-herbs/` — hero poster loaded as high-priority resource, before page CSS
- [ ] Live site: DevTools Network tab — image requests show `Content-Type: image/avif` on Chrome (not `image/webp`)
- [ ] Live site: `/batana-oil/` — `AudienceWholesaleSplit` right column shows animated world map, not static green box
- [ ] Live site: map paths animate from Honduras → 7 regions on scroll into view
- [ ] Lighthouse CI score: LCP improvement visible on batana-oil, home pages
