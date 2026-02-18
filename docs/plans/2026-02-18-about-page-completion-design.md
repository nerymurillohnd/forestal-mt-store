# About Page Completion — Design Document

**Date:** 2026-02-18
**Status:** Approved
**Scope:** Complete missing About page content + new component architecture

---

## Problem

The About page (`src/pages/about/index.astro`) renders ~65-70% of the content defined in `src/content/pages/about.mdx`. Four sections are completely absent, several are condensed, and the page lacks the visual richness expected from a premium ethnobotanical brand.

### Missing Sections

| Section | MDX Lines | Content |
|---------|-----------|---------|
| How We Sell | 194-214 | B2B/B2C breakdown with features and CTAs |
| Our Slogan | 368-372 | "Exporting Nature Without Borders" explanation |
| Leadership | 339-352 | Founder, current roles, Nery Samuel Murillo |
| Our Commitment | 392-397 | Closing statement with brand promise |

### Condensed Content

- Who We Are: 5 differentiator bullets absent
- Our Story: narrative compressed into timeline entries
- History sections 5-7: Expansion, Diversification, Present Day details lost
- Collections: Origin/Processing/Applications metadata absent
- "We ship worldwide..." paragraph absent from "We Are The Source"

---

## Visual Direction

**Concept: "Botanical Immersion Sutil"**

Inspired by Plant Hotel landing page aesthetic (Pinterest ref), refined for Forestal MT premium positioning:

- Alternating sections between light surfaces (warm/parchment) and **botanical photography backgrounds** from R2
- Glass cards (`bg-charcoal/80 backdrop-blur-sm border-white/10`) floating over botanical imagery
- Impact numbers in enormous display typography (`--font-display`, clamp 3-5rem)
- Same token palette (charcoal, gold, leaf-green) — botanical sections add depth, not new colors
- More subtle than reference: less saturated overlays, more whitespace, serif elegance

**Reference brands:** Tata Harper (alternating blocks), Pai Skincare (accordion certifications), Aesop (pullquote separator), Le Labo (editorial restraint).

---

## R2 Images for Botanical Sections

Base URL: `https://cdn.forestal-mt.com/pages/about/`

| Filename | Section | Usage |
|----------|---------|-------|
| `sourced-from-origin.jpg` | "We Are The Source" BotanicalSection | Background with glass overlay |
| `indiginuos-partner.jpg` | ImpactBar | Background for animated counters |
| `the-founder-legacy.jpg` | Leadership grid | Founder legacy, leadership section |
| `murillo-tejada-family.jpg` | SplitEditorial "Our Story" + PullQuote | Family narrative, origin story |
| `ethnobotanical-collections.jpg` | "How We Sell" + SloganBanner | Botanical background |

Excluded: `hero.jpg`, `og.jpg` (used elsewhere).

---

## New Components (16 new, 32 total)

### Astro Components (static, zero JS) — 11

#### 1. BotanicalSection.astro

Full-width section with R2 botanical image background + gradient overlay + child content.

```
Props:
  image: string        — R2 CDN URL
  alt: string          — Image alt text
  overlay?: string     — Tailwind gradient class (default: from-charcoal/85 via-charcoal/50 to-charcoal/30)
  class?: string       — Additional container classes
Slot: default          — Child content
```

Pattern: `<section>` → absolute `<img>` background → gradient overlay div → relative z-10 content slot.

#### 2. SplitEditorial.astro

50/50 image + text block with alternating direction.

```
Props:
  eyebrow?: string
  heading: string
  paragraphs: string[]
  image: string         — R2 CDN URL
  imageAlt?: string
  direction?: "left" | "right"  — Image side (default: "left")
  variant?: "light" | "dark"
```

Pattern: CSS grid `grid-cols-1 lg:grid-cols-2`. Image side uses `aspect-[4/5]` with object-cover. Text side has eyebrow + heading + paragraphs with body font.

#### 3. PullQuote.astro

Full-width founder/brand quote as editorial separator.

```
Props:
  quote: string
  attribution?: string
  image?: string        — Optional background image
  variant?: "light" | "dark"
```

Pattern: Large italic serif text (`--font-body`, clamp 1.25-2rem), gold decorative marks ("), attribution with gold dash. Optional botanical background (becomes BotanicalSection internally).

#### 4. GlassCard.astro

Semi-transparent card for dark/botanical backgrounds.

```
Props:
  number?: string
  eyebrow?: string
  heading: string
  body: string
```

Pattern: `bg-white/[0.06] backdrop-blur-sm border border-white/10 rounded-[2px]`. Gold rule top or left. Hover: `bg-white/[0.08]`. Works on dark and botanical sections.

#### 5. LeadershipCard.astro

Team member card with photo area + details.

```
Props:
  name: string
  title: string
  bio: string
  image?: string        — Photo URL (placeholder if absent)
```

Pattern: Vertical card. Top: image area (aspect-[3/4], object-cover or gold-bordered placeholder). Bottom: name in `--font-heading`, title in `--font-ui` uppercase, bio in `--font-body`. Gold top accent line like GoldTopCard.

#### 6. ChannelSplit.astro

Two-column B2B/B2C layout with distinct CTAs.

```
Props:
  b2b: { heading, items: string[], cta: { label, url } }
  b2c: { heading, items: string[], cta: { label, url } }
```

Pattern: `grid-cols-1 md:grid-cols-2 gap-6`. Each side is a GlassCard or bordered card. B2B: leaf-green accent. B2C: gold accent. Different CTA styles per channel.

#### 7. SloganBanner.astro

Full-width brand statement with botanical background.

```
Props:
  slogan: string
  description?: string
  image?: string         — Background image
```

Pattern: BotanicalSection internally. Slogan in `--font-display` enormous (clamp 2-4rem), centered. Description below in `--font-body` smaller. Gold decorative lines above and below slogan.

#### 8. AccordionItem.astro

CSS-only expandable section using `<details>/<summary>`.

```
Props:
  title: string
  open?: boolean
Slot: default            — Expandable content
```

Pattern: `<details>` with styled `<summary>`. Gold chevron rotates on open (CSS `details[open] > summary svg { rotate: 180deg }`). Content area with `--font-body` text, padding, border-bottom gold/10.

#### 9. AccordionGroup.astro

Container for multiple AccordionItems.

```
Props:
  variant?: "light" | "dark"
Slot: default             — AccordionItem children
```

Pattern: `divide-y divide-gold/10` container. Manages spacing between items.

#### 10. FeatureList.astro

Styled bullet list with gold markers.

```
Props:
  items: string[]
  variant?: "light" | "dark"
```

Pattern: `<ul>` with each `<li>` having a gold dash marker (`h-px w-5 bg-gold/50`). Font: `--font-body`, 14px. Reusable anywhere bullet lists appear.

#### 11. DualCTASection.astro

Section with closing text + two side-by-side CTAs.

```
Props:
  eyebrow?: string
  heading: string
  description?: string
  primaryCta: { label, url }
  secondaryCta: { label, url }
  variant?: "green" | "dark"
```

Pattern: Green background (leaf-green) with grain texture. Centered text + two buttons (primary solid gold, secondary border white). Replaces current inline Partner CTA.

### Preact Islands (interactive) — 5

#### 12. CountUpIsland.tsx

Single animated counter triggered on scroll.

```
Props:
  target: number
  label: string
  prefix?: string
  suffix?: string
```

Implementation: `IntersectionObserver` (threshold 0.3) → `requestAnimationFrame` loop over 1800ms. Easing: ease-out. Display: `--font-display` for number, `--font-ui` uppercase for label. ~30 lines, zero deps.

#### 13. ImpactBarIsland.tsx

Container for 3-4 CountUp instances with orchestrated stagger.

```
Props:
  stats: { target, label, prefix?, suffix? }[]
  staggerMs?: number    — Delay between each counter start (default: 200)
```

Pattern: Horizontal flex row (responsive grid on mobile). Each stat is a CountUp. Staggered animation start for visual flow. Used inside BotanicalSection for background.

#### 14. AccordionIsland.tsx

Interactive accordion with smooth height animation.

```
Props:
  items: { title: string, content: string }[]
  allowMultiple?: boolean
```

Implementation: State-managed open/close. Smooth height transition via `max-height` or `grid-template-rows: 0fr → 1fr`. ARIA: `role="region"`, `aria-expanded`. Keyboard: Enter/Space toggle.

#### 15. TabSwitcherIsland.tsx

Tabbed content panel for B2B/B2C switching.

```
Props:
  tabs: { label: string, content: ComponentChildren }[]
  defaultTab?: number
```

Implementation: ARIA tabpanel pattern. Keyboard: Arrow keys switch tabs. Active tab: gold underline. Content crossfade transition. ~50 lines.

#### 16. ScrollRevealIsland.tsx

Generic wrapper for fade-in + slide-up on scroll.

```
Props:
  delay?: number        — ms delay
  direction?: "up" | "left" | "right"
Slot: children
```

Implementation: IntersectionObserver (threshold 0.15). CSS transition: `opacity 0.7s ease, transform 0.7s ease`. One-shot (disconnects after trigger). ~20 lines.

---

## About Page — Final Section Structure (20 sections)

```
 1. Hero (existing)
 2. Breadcrumb (existing)

 ── INTRODUCTION ──
 3. Who We Are — narrative paragraphs + FeatureList (5 MDX bullets)
 4. TrustMarquee (existing)

 ── PURPOSE ──
 5. Mission/Vision/Promise — GoldTopCards (existing)

 ── BOTANICAL IMMERSION 1 ──
 6. BotanicalSection "We Are The Source"
    Background: sourced-from-origin.jpg
    Content: GlassCards with source differentiation text
    Enhanced: add "We ship worldwide..." paragraph

 7. ImpactBarIsland (4 counters)
    Background: indiginuos-partner.jpg (via BotanicalSection)
    Stats: [5,000+ Hectares] [46 Products] [4 Continents] [6+ Years]

 8. PullQuote — Founder voice
    Quote from Nery Roberto Murillo Montalvan
    No background image (clean separator)

 ── ORIGIN STORY ──
 9. SplitEditorial "Our Story"
    Image: the-founder-legacy.jpg (left)
    Text: MDX narrative paragraphs (lines 130-139)

10. Timeline (existing code, cleaned up)

11. AccordionGroup "History Deep Dive"
    3 items: Expansion into Ethnobotanicals, Strategic Diversification, Present Day
    Content from MDX sections §5, §6, §7

 ── COLLECTIONS ──
12. Collections — 3 portrait cards (existing)

 ── BOTANICAL IMMERSION 2 ──
13. BotanicalSection + ChannelSplit "How We Sell"
    Background: ethnobotanical-collections.jpg
    B2B: wholesale features + /wholesale/ CTA
    B2C: retail features + /products/ CTA

 ── VALUES & PEOPLE ──
14. Values — GoldTopCards grid (existing)

15. Leadership grid
    Background or accent: murillo-tejada-family.jpg
    3 LeadershipCards: Founder + General Management + Operations/Finance

16. Our Logo + OriginMetadata (existing)

 ── BRAND IDENTITY ──
17. SloganBanner "Exporting Nature Without Borders"
    Background: ethnobotanical-collections.jpg (reused, different crop via Image Resizing)
    Large display text + explanation paragraph

18. Community Impact — FeatureList (upgraded from inline list)

 ── CLOSING ──
19. PullQuote variant — "Our Commitment" text as closing statement

20. DualCTASection "Partner With Us"
    Primary: Get in Touch → /contact/
    Secondary: Wholesale Program → /wholesale/
```

---

## Technical Decisions

### Astro vs Preact Criteria

| Needs | → Technology |
|-------|-------------|
| Layout, text, style only | Astro component (zero JS shipped) |
| Scroll-triggered animation | Preact island `client:visible` |
| Interactive state (tabs, accordion toggle) | Preact island `client:visible` |
| Simple expandable content | Astro `<details>/<summary>` (zero JS) |

### Zero External Dependencies

All interactive components use native browser APIs:
- `IntersectionObserver` for scroll triggers
- `requestAnimationFrame` for counter animation
- `<details>/<summary>` for CSS-only accordion
- Preact hooks (`useState`, `useEffect`, `useRef`) for islands
- **NO** Framer Motion (incompatible with Preact)
- **NO** GSAP (60KB+, overkill)
- **NO** animation libraries

### Image Optimization

All R2 images served through Cloudflare Image Resizing:
- Background images: `width=1920,format=webp,quality=80`
- Editorial images: `width=960,format=webp,quality=85`
- Leadership photos: `width=480,format=webp,quality=85`

URL pattern: `https://cdn.forestal-mt.com/cdn-cgi/image/width=W,format=webp/{path}`

---

## Component Reusability

| Component | About | Home | Catalogs | Wholesale | Contact |
|-----------|-------|------|----------|-----------|---------|
| BotanicalSection | x | x | x | x | |
| SplitEditorial | x | | x | | |
| PullQuote | x | x | | | |
| GlassCard | x | x | x | x | |
| LeadershipCard | x | | | | |
| ChannelSplit | x | x | | x | |
| SloganBanner | x | x | | | |
| AccordionItem/Group | x | | | x | x |
| FeatureList | x | | x | x | |
| DualCTASection | x | x | x | x | x |
| CountUpIsland | x | x | | x | |
| ImpactBarIsland | x | x | | | |
| AccordionIsland | x | | | x | x |
| TabSwitcherIsland | x | | | x | |
| ScrollRevealIsland | x | x | x | x | x |

Most components serve 3+ pages, justifying the investment.
