# Footer Design — Forestal MT Store

**Date:** 2026-02-18
**Status:** Approved
**Component:** `src/components/Footer.astro`

---

## Overview

Replace the current minimal footer (light bg, no logo, no social, no payment icons) with a production-ready e-commerce footer. Dark botanical aesthetic, 5-column desktop layout, fully responsive mobile layout.

---

## Visual Style

- **Background:** `.surface-dark.grain` — charcoal `#1a1a1a` with warm amber radial gradient + noise texture overlay (both utility classes already defined in `global.css`)
- **Palette on dark:**
  - Column headings: `text-gold` (`#F3C00D`) — Cinzel, xs, uppercase, widest tracking
  - Body links: `text-white/60` → `text-white` on hover with `.link-draw` underline animation
  - Tagline: `text-white/80`
  - Bottom bar text: `text-white/40`
  - Dividers: `border-white/10`

---

## Layout — Desktop (lg+)

Grid: `grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-12`

| Col | Content |
|-----|---------|
| 1 (wide) | `logo-light.png` — max-w-[160px], no text below |
| 2 | **Quick Links** — About, Wholesale, Shop, Contact |
| 3 | **Explore** — Batana Oil, Jimerito Honey, Wild Herbs, FAQs |
| 4 | **Docs & Policies** — Terms, Privacy, Shipping & Returns, Documents |
| 5 | **Follow Us** — social icons in 2×2 grid (FB, Instagram, TikTok, LinkedIn) |

---

## Layout — Mobile (<768px)

- Logo column: full width, centered, `py-8`
- 4 link columns → `grid-cols-2 gap-8`
- Follow Us: social icons in horizontal row `flex flex-wrap gap-4`
- Bottom bar: stacked vertically (payment | copyright | location)
- All link items: `min-h-[44px]` touch target

---

## Tagline Divider (above bottom bar)

```
──── [gold-rule] ────  Exporting Nature Without Borders  ──── [gold-rule] ────
```

- Font: `var(--font-display)` (The New Elegance), `text-xl italic`, `text-white/80`
- Flanked by `.gold-rule` elements (already in global.css)
- `py-8` spacing

---

## Bottom Bar

Three-column flex (`justify-between items-center`), `border-t border-white/10 pt-6`:

**Left — Payment Icons (5 total):**

| Brand | Implementation |
|-------|---------------|
| Visa | Inline SVG — blue wordmark on white rounded pill |
| Mastercard | Inline SVG — overlapping red/orange circles |
| Moneygram | Text pill — `bg-[#EE3124]` red, white text "Moneygram" |
| Western Union | Text pill — `bg-[#FFD700]` yellow, black text "WU" |
| Banco Atlántida | Text pill — `bg-[#004A97]` blue, white text "Atlántida" |

All pills: `rounded-sm h-5 px-2 text-[10px] font-bold`

**Center — Copyright:**
```
© 2026 Forestal Murillo Tejada S. de R.L. | All rights reserved.
```
`text-xs font-ui text-white/40`

**Right — Location:**
```
Olancho, Honduras
```
`text-xs font-ui text-white/40`

---

## Back-to-Top Button

- Fixed position: `fixed bottom-6 right-6 z-30`
- Visible only after 300px scroll (inline `<script>` in Footer.astro — no Preact island)
- Size: 44×44px (accessible touch target)
- Colors: `bg-gold text-charcoal` → hover `bg-gold-dark`
- Icon: upward arrow SVG
- `aria-label="Back to top"`
- Smooth scroll: `window.scrollTo({ top: 0, behavior: 'smooth' })`
- `prefers-reduced-motion` handled: use instant scroll when reduced motion preferred

---

## Social Links

Placeholder `href="#"` — real URLs to be added when accounts are confirmed.

| Platform | Icon | Notes |
|----------|------|-------|
| Facebook | Meta "f" SVG | 20×20 |
| Instagram | Camera outline SVG | 20×20 |
| TikTok | TikTok note SVG | 20×20 |
| LinkedIn | "in" SVG | 20×20 |

Hover: `text-white/60` → `text-white`, with `transition-colors`

---

## Placeholder Links

Links without MVP pages use `href="/"` until pages are built:
- Shop → `/` (future: `/products/`)
- FAQs → `/` (future: `/community/faqs/`)
- Documents → `/` (future: `/documents/`)

---

## Implementation Notes

- **Single file change:** `src/components/Footer.astro` only
- **No new CSS** — all utility classes (`surface-dark`, `grain`, `gold-rule`, `link-draw`) already defined in `global.css`
- **No Preact island** — back-to-top uses inline `<script>` (no hydration cost)
- **Logo import:** `import logoLight from "../assets/logos/logo-light.png"` via Astro `<Image>` component
- **Year:** computed server-side `const year = new Date().getFullYear()`
- **Accessibility:** all social + back-to-top links have `aria-label`; footer landmark `<footer role="contentinfo">`

---

## Files to Modify

| File | Action |
|------|--------|
| `src/components/Footer.astro` | Full replacement of current footer |

No other files need changes.
