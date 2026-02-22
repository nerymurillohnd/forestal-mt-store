# Header Search Autocomplete — Design

**Date:** 2026-02-22
**Status:** Approved — ready for implementation
**Scope:** `SearchIsland.tsx` (Preact) + `Header.astro` modifications

---

## Problem

The site spec requires a global search box in the header on every page with two complementary layers:

1. **UX (autocomplete):** Typeahead dropdown → click navigates directly to PDP
2. **SEO (SearchAction):** Entry point from Google Sitelinks (`/products/?q={term}`) — already wired in `ShopFilterIsland`

The header currently has no search UI. This feature closes that gap.

---

## Approach

**Preact island (`SearchIsland.tsx`) with `client:load`.**

Search index built at build time in `Header.astro` from `products.json` + `media.json` + `content.json`. Passed as a serialized prop. Zero runtime API calls. ~8KB serialized for 46 products — acceptable.

---

## Data Structure

```ts
interface SearchEntry {
  handler: string; // "batana-oil-virgin"
  name: string; // "Virgin Batana Oil" (display)
  nameLower: string; // pre-normalized: lowercase + diacritics stripped
  catalog: string; // "Batana Oil"
  catalogSlug: string; // "batana-oil"
  imageUrl: string; // "https://cdn.forestal-mt.com/products/productGroup/batana-oil-virgin.png"
  url: string; // "/products/batana-oil-virgin/"
  keywords: string[]; // botanical name + alternate names, pre-normalized
  priority: number; // 0–10, star products sort higher
}
```

### Normalization (build time)

```ts
function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
```

Applied to `nameLower` and each entry in `keywords[]`. Allows "batana" to match "Bataná".

### Keyword sources

- `content.json` → `botanical_name` field
- `products.json` → product name variants (future: manual override file)

### Priority assignments

- Batana Oil products: priority 8–10
- Stingless Bee Honey: priority 6–7
- Traditional Herbs: priority 0–5 (alphabetical within group)

---

## Search Algorithm

No external library (Fuse.js not needed for 46 items).

```
score = 0
if nameLower.startsWith(q)  → score += 3
if nameLower.includes(q)    → score += 2
if any keyword.includes(q)  → score += 1

sort by score DESC, then priority DESC
slice to max 6 results
```

Debounce: 150ms on input.

---

## Island State

```ts
query: string; // current input value
highlightedIndex: number; // -1 = none; 0..N = result index
isOpen: boolean; // dropdown visible
```

Refs:

- `inputRef` — for programmatic focus
- `lupaButtonRef` — to restore focus on close (desktop)
- `listRef` — for scroll-into-view on keyboard nav

---

## UX — Desktop (≥ lg)

1. **Lupa icon** rendered to the right of nav links (left of the hidden hamburger)
2. Click → nav links fade out (`opacity-0 pointer-events-none`), input expands full-width with `autoFocus` (200ms ease transition from right)
3. **Clear (X) button** inside input wrapper (absolute positioned, right side) — visible when `query.length > 0`. Click → `setQuery("") + inputRef.current?.focus()`
4. Typing → dropdown renders below input:
   - Max 6 results
   - Each result: thumbnail 40×40 (`object-cover ring-1 ring-black/5`, hover `scale-105` 80ms) + product name with **matched term bolded** + catalog badge
   - Active result: `bg-zinc-100 ring-1 ring-leaf-green/20`
   - No results: `"No results for '{query}'" + "Browse all products →"` → `/products/?q=${encodeURIComponent(query)}`
5. Close → `setIsOpen(false)`, restore nav, `lupaButtonRef.current?.focus()`

---

## UX — Mobile (< lg)

1. **Lupa icon** visible in header to the left of the hamburger button
2. Click → full-width search bar slides in from top (`position: fixed, z-50`, 200ms), `autoFocus` on input, `document.body.style.overflow = "hidden"`
3. Dropdown renders below the bar
4. X button closes: `setIsOpen(false)`, restore `document.body.style.overflow = ""`

---

## Keyboard Navigation

| Key                  | Behavior                                                               |
| -------------------- | ---------------------------------------------------------------------- |
| `↓`                  | Move `highlightedIndex` down; scroll result into view                  |
| `↑`                  | Move `highlightedIndex` up; scroll result into view                    |
| `Enter`              | If index ≥ 0 → navigate to PDP. If index = -1 → `/products/?q={query}` |
| `Escape`             | Close dropdown, restore focus to lupa button                           |
| `Tab` on input       | Move focus to first result (do NOT close)                              |
| `Tab` on last result | Close dropdown, move focus to next header element                      |
| `Shift+Tab`          | Reverse of above                                                       |

---

## Accessibility

- Input: `role="combobox"`, `aria-expanded={isOpen}`, `aria-autocomplete="list"`, `aria-controls="search-listbox"`, `aria-activedescendant={activeId}`
- Dropdown: `role="listbox"`, `id="search-listbox"`
- Each result: `role="option"`, `id="search-option-{i}"`, `aria-selected={highlightedIndex === i}`
- WCAG AA compliant

---

## Files to Create / Modify

| File                                      | Action                                                      |
| ----------------------------------------- | ----------------------------------------------------------- |
| `src/components/islands/SearchIsland.tsx` | Create                                                      |
| `src/components/Header.astro`             | Modify — import island, build search index, add lupa button |

---

## Out of Scope

- Server-side search (D1 FTS5) — future, after SSR migration
- Search analytics / tracking
- Voice search
- Search history / recent searches
- Keyboard shortcut to open search (e.g. `/` or `Cmd+K`) — future enhancement
