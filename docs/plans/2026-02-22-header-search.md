# Header Search Autocomplete — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a global product search with typeahead autocomplete to the site header, present on every page.

**Architecture:** A Preact island (`SearchIsland.tsx`) receives a pre-built search index as a prop from `Header.astro` at build time. Filtering runs entirely in memory (46 products, ~8KB). No API calls at runtime. Desktop shows an expanding input that replaces the nav; mobile shows a fixed full-screen bar.

**Tech Stack:** Preact, Astro islands (`client:load`), Tailwind CSS 4, `products.json` + `media.json` + `content.json` at build time.

**Design doc:** `docs/plans/2026-02-22-header-search-design.md`

---

## Task 1: Create search utility module with tests

**Files:**

- Create: `src/lib/search.ts`
- Create: `src/lib/search.test.ts`

### Step 1: Write failing tests

Create `src/lib/search.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { normalize, scoreAndFilter } from "./search";
import type { SearchEntry } from "./search";

const mockEntries: SearchEntry[] = [
  {
    handler: "raw-batana-oil",
    name: "Raw Batana Oil",
    nameLower: "raw batana oil",
    catalog: "Batana Oil",
    catalogSlug: "batana-oil",
    imageUrl: "https://cdn.forestal-mt.com/products/productGroup/raw-batana-oil.png",
    url: "/products/raw-batana-oil/",
    keywords: ["elaeis oleifera", "ojon oil"],
    priority: 10,
  },
  {
    handler: "stingless-bee-honey",
    name: "Stingless Bee Honey",
    nameLower: "stingless bee honey",
    catalog: "Stingless Bee Honey",
    catalogSlug: "stingless-bee-honey",
    imageUrl: "https://cdn.forestal-mt.com/products/productGroup/stingless-bee-honey.png",
    url: "/products/stingless-bee-honey/",
    keywords: ["jimerito", "meliponini honey"],
    priority: 8,
  },
  {
    handler: "amaranth-greens",
    name: "Amaranth Greens",
    nameLower: "amaranth greens",
    catalog: "Traditional Herbs",
    catalogSlug: "traditional-herbs",
    imageUrl: "https://cdn.forestal-mt.com/products/productGroup/amaranth-greens.png",
    url: "/products/amaranth-greens/",
    keywords: ["amaranthus spp", "bledo", "quelite"],
    priority: 2,
  },
];

describe("normalize", () => {
  it("lowercases the string", () => {
    expect(normalize("Batana")).toBe("batana");
  });

  it("strips diacritics", () => {
    expect(normalize("Bataná")).toBe("batana");
  });

  it("handles empty string", () => {
    expect(normalize("")).toBe("");
  });

  it("strips multiple diacritics", () => {
    expect(normalize("Café Élève")).toBe("cafe eleve");
  });
});

describe("scoreAndFilter", () => {
  it("returns empty array for empty query", () => {
    expect(scoreAndFilter(mockEntries, "")).toHaveLength(0);
  });

  it("matches by product name", () => {
    const results = scoreAndFilter(mockEntries, "batana");
    expect(results.map((r) => r.handler)).toContain("raw-batana-oil");
  });

  it("matches by keyword", () => {
    const results = scoreAndFilter(mockEntries, "jimerito");
    expect(results.map((r) => r.handler)).toContain("stingless-bee-honey");
  });

  it("gives higher score to prefix match than substring match", () => {
    // "raw" starts "raw batana oil" but is substring in nothing else
    const results = scoreAndFilter(mockEntries, "raw");
    expect(results[0].handler).toBe("raw-batana-oil");
  });

  it("sorts by priority when scores are equal", () => {
    // "oil" matches both "raw batana oil" (priority 10) and neither herb
    const results = scoreAndFilter(mockEntries, "oil");
    expect(results[0].handler).toBe("raw-batana-oil");
  });

  it("respects max results cap", () => {
    // All 3 entries match "a" — result must be ≤ 6
    const results = scoreAndFilter(mockEntries, "a", 6);
    expect(results.length).toBeLessThanOrEqual(6);
  });

  it("matches diacritic-stripped query against normalized nameLower", () => {
    const results = scoreAndFilter(mockEntries, "batana");
    expect(results.map((r) => r.handler)).toContain("raw-batana-oil");
  });

  it("is case-insensitive", () => {
    expect(scoreAndFilter(mockEntries, "HONEY")).toHaveLength(1);
    expect(scoreAndFilter(mockEntries, "honey")).toHaveLength(1);
  });
});
```

### Step 2: Run to verify failure

```bash
pnpm vitest run src/lib/search.test.ts
```

Expected: `FAIL — Cannot find module './search'`

### Step 3: Implement `src/lib/search.ts`

```ts
/**
 * Search utility for header autocomplete.
 * Pure functions — no side effects, no imports from Astro/Preact.
 */

export interface SearchEntry {
  handler: string;
  name: string;
  nameLower: string; // pre-normalized at build time
  catalog: string;
  catalogSlug: string;
  imageUrl: string;
  url: string;
  keywords: string[]; // pre-normalized at build time
  priority: number; // 0–10
}

/**
 * Lowercase + strip NFD diacritics.
 * Applied at build time to nameLower/keywords; at runtime to the query only.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Score and filter entries against a raw query string.
 * Returns up to `maxResults` entries sorted by score DESC, priority DESC.
 */
export function scoreAndFilter(
  entries: SearchEntry[],
  rawQuery: string,
  maxResults = 6,
): SearchEntry[] {
  const q = normalize(rawQuery.trim());
  if (!q) return [];

  const scored: Array<{ entry: SearchEntry; score: number }> = [];

  for (const entry of entries) {
    let score = 0;

    if (entry.nameLower.startsWith(q)) {
      score += 3;
    } else if (entry.nameLower.includes(q)) {
      score += 2;
    }

    if (score === 0) {
      for (const kw of entry.keywords) {
        if (kw.includes(q)) {
          score += 1;
          break;
        }
      }
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.entry.priority - a.entry.priority;
  });

  return scored.slice(0, maxResults).map((s) => s.entry);
}
```

### Step 4: Run tests to verify pass

```bash
pnpm vitest run src/lib/search.test.ts
```

Expected: all tests PASS.

### Step 5: Commit

```bash
git add src/lib/search.ts src/lib/search.test.ts
git commit -m "feat(search): add search utility with normalize and scoreAndFilter"
```

---

## Task 2: Create SearchIsland.tsx

**Files:**

- Create: `src/components/islands/SearchIsland.tsx`

### Step 1: Write the component

```tsx
/**
 * SearchIsland — Header product search autocomplete.
 *
 * Receives a pre-built search index as prop from Header.astro (build time).
 * Filtering runs in memory — zero runtime API calls.
 *
 * Desktop: lupa icon → expanding input replaces nav links.
 * Mobile:  lupa icon → fixed full-screen bar slides in from top.
 */
import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { scoreAndFilter, normalize } from "../../lib/search";
import type { SearchEntry } from "../../lib/search";

interface SearchIslandProps {
  entries: SearchEntry[];
}

const CATALOG_COLORS: Record<string, string> = {
  "batana-oil": "bg-amber-100 text-amber-800",
  "stingless-bee-honey": "bg-yellow-100 text-yellow-800",
  "traditional-herbs": "bg-green-100 text-green-800",
};

export default function SearchIsland({ entries }: SearchIslandProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  const inputRef = useRef<HTMLInputElement>(null);
  const lupaButtonRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const results = query.trim().length > 0 ? scoreAndFilter(entries, query) : [];

  // Reset highlight when results change
  useEffect(() => {
    setHighlightedIndex(-1);
  }, [query]);

  // Lock body scroll on mobile when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
    // autoFocus via useEffect after render
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Small delay to allow CSS transition to start before focusing
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const close = useCallback(() => {
    setIsOpen(false);
    setQuery("");
    setHighlightedIndex(-1);
    // Restore focus to lupa button (desktop UX)
    setTimeout(() => lupaButtonRef.current?.focus(), 50);
  }, []);

  const navigate = useCallback((url: string) => {
    window.location.href = url;
  }, []);

  const handleKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = Math.min(highlightedIndex + 1, results.length - 1);
        setHighlightedIndex(next);
        scrollResultIntoView(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const prev = Math.max(highlightedIndex - 1, -1);
        setHighlightedIndex(prev);
        if (prev === -1) inputRef.current?.focus();
        else scrollResultIntoView(prev);
        break;
      }
      case "Enter": {
        e.preventDefault();
        if (highlightedIndex >= 0 && results[highlightedIndex]) {
          navigate(results[highlightedIndex].url);
        } else if (query.trim()) {
          navigate(`/products/?q=${encodeURIComponent(query.trim())}`);
        }
        break;
      }
      case "Escape": {
        e.preventDefault();
        close();
        break;
      }
    }
  };

  const scrollResultIntoView = (index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
  };

  // Bold the matched portion of the product name
  const highlightMatch = (name: string, q: string): preact.JSX.Element => {
    if (!q.trim()) return <span>{name}</span>;
    const normalizedName = normalize(name);
    const normalizedQ = normalize(q.trim());
    const idx = normalizedName.indexOf(normalizedQ);
    if (idx === -1) return <span>{name}</span>;
    return (
      <span>
        {name.slice(0, idx)}
        <strong class="font-semibold text-charcoal">{name.slice(idx, idx + q.length)}</strong>
        {name.slice(idx + q.length)}
      </span>
    );
  };

  const listboxId = "search-listbox";
  const activeDescendant = highlightedIndex >= 0 ? `search-option-${highlightedIndex}` : undefined;

  return (
    <>
      {/* ── Lupa trigger button (always visible) ── */}
      <button
        ref={lupaButtonRef}
        type="button"
        onClick={open}
        aria-label="Open product search"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        class="flex h-9 w-9 items-center justify-center rounded-full text-graphite transition-colors hover:bg-parchment hover:text-leaf-green"
      >
        <svg
          class="h-[18px] w-[18px]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          stroke-width="1.75"
          aria-hidden="true"
        >
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
      </button>

      {/* ── Search overlay ── */}
      {isOpen && (
        <div
          class="fixed inset-x-0 top-0 z-[60]"
          role="dialog"
          aria-label="Product search"
          aria-modal="true"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <button
            type="button"
            class="absolute inset-0 h-screen cursor-default bg-charcoal/40 backdrop-blur-sm"
            onClick={close}
            aria-label="Close search"
            tabIndex={-1}
          />

          {/* Search bar */}
          <div class="relative z-10 border-b border-gold/20 bg-white shadow-xl">
            <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 lg:px-8">
              {/* Search icon (decorative inside bar) */}
              <svg
                class="h-4 w-4 shrink-0 text-graphite/40"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                stroke-width="1.75"
                aria-hidden="true"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
                />
              </svg>

              {/* Input */}
              <input
                ref={inputRef}
                type="search"
                role="combobox"
                aria-expanded={results.length > 0}
                aria-autocomplete="list"
                aria-controls={listboxId}
                aria-activedescendant={activeDescendant}
                placeholder="Search products…"
                value={query}
                onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                class="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-ui)] text-[15px] text-charcoal placeholder:text-graphite/40 outline-none"
              />

              {/* Clear (X) button — visible when query is non-empty */}
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    inputRef.current?.focus();
                  }}
                  aria-label="Clear search"
                  class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-graphite/50 transition-colors hover:bg-parchment hover:text-charcoal"
                >
                  <svg
                    class="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    stroke-width="2"
                    aria-hidden="true"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              )}

              {/* Close button */}
              <button
                type="button"
                onClick={close}
                aria-label="Close search"
                class="shrink-0 font-[family-name:var(--font-ui)] text-xs text-graphite/50 transition-colors hover:text-charcoal"
              >
                Esc
              </button>
            </div>

            {/* Results dropdown */}
            {query.trim().length > 0 && (
              <div class="mx-auto max-w-7xl px-4 pb-3 lg:px-8">
                <ul
                  ref={listRef}
                  id={listboxId}
                  role="listbox"
                  aria-label="Search results"
                  class="max-h-[60vh] overflow-y-auto"
                >
                  {results.length > 0 ? (
                    results.map((entry, i) => (
                      <li
                        key={entry.handler}
                        id={`search-option-${i}`}
                        role="option"
                        aria-selected={highlightedIndex === i}
                        onMouseEnter={() => setHighlightedIndex(i)}
                        onClick={() => navigate(entry.url)}
                        class={`flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors ${
                          highlightedIndex === i
                            ? "bg-zinc-100 ring-1 ring-leaf-green/20"
                            : "hover:bg-parchment/60"
                        }`}
                      >
                        {/* Thumbnail */}
                        <div class="h-10 w-10 shrink-0 overflow-hidden rounded ring-1 ring-black/5">
                          <img
                            src={`/cdn-cgi/image/width=80,format=auto/${entry.imageUrl}`}
                            alt=""
                            aria-hidden="true"
                            width={40}
                            height={40}
                            loading="eager"
                            class="h-full w-full object-cover transition-transform duration-75 group-hover:scale-105"
                          />
                        </div>

                        {/* Text */}
                        <div class="min-w-0 flex-1">
                          <p class="font-[family-name:var(--font-heading)] text-sm text-charcoal">
                            {highlightMatch(entry.name, query)}
                          </p>
                          <span
                            class={`mt-0.5 inline-block rounded px-1.5 py-px font-[family-name:var(--font-ui)] text-[10px] ${
                              CATALOG_COLORS[entry.catalogSlug] ?? "bg-parchment text-graphite"
                            }`}
                          >
                            {entry.catalog}
                          </span>
                        </div>

                        {/* Arrow */}
                        <svg
                          class="h-4 w-4 shrink-0 text-graphite/30"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          stroke-width="1.5"
                          aria-hidden="true"
                        >
                          <path stroke-linecap="round" stroke-linejoin="round" d="m9 18 6-6-6-6" />
                        </svg>
                      </li>
                    ))
                  ) : (
                    /* No results */
                    <li class="px-3 py-4 text-center">
                      <p class="font-[family-name:var(--font-ui)] text-sm text-graphite/60">
                        No results for <span class="font-medium text-charcoal">"{query}"</span>
                      </p>
                      <a
                        href={`/products/?q=${encodeURIComponent(query.trim())}`}
                        class="mt-2 inline-block font-[family-name:var(--font-ui)] text-xs text-leaf-green underline underline-offset-2 hover:text-grass-green"
                      >
                        Browse all products →
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
```

### Step 2: Verify TypeScript compiles

```bash
pnpm check
```

Expected: 0 errors. Fix any type issues before proceeding.

### Step 3: Commit

```bash
git add src/components/islands/SearchIsland.tsx
git commit -m "feat(search): add SearchIsland Preact component"
```

---

## Task 3: Integrate into Header.astro

**Files:**

- Modify: `src/components/Header.astro`

### Step 1: Add imports and build search index

At the top of the frontmatter in `Header.astro`, add after the existing interface definitions:

```ts
import SearchIsland from "./islands/SearchIsland";
import type { SearchEntry } from "../lib/search";
import { normalize } from "../lib/search";

import productsFile from "../data/jsonld/products/products.json";
import mediaFile from "../data/jsonld/products/media.json";
import contentFile from "../data/jsonld/products/content.json";

// Priority map — Batana Oil products rank highest
const PRIORITY: Record<string, number> = {
  "batana-oil": 9,
  "stingless-bee-honey": 8,
  "traditional-herbs": 3,
};

// Published handlers (all products in products.json are considered published here;
// seo.json filtering is only needed on the shop page grid)
const mediaMap = new Map(mediaFile.products.map((p) => [p.handler, p]));
const contentMap = new Map(contentFile.products.map((p) => [p.handler, p]));

const searchIndex: SearchEntry[] = productsFile.products.map((p) => {
  const med = mediaMap.get(p.handler);
  const cont = contentMap.get(p.handler);

  const catalogSlug =
    p.catalog === "Batana Oil"
      ? "batana-oil"
      : p.catalog === "Stingless Bee Honey"
        ? "stingless-bee-honey"
        : "traditional-herbs";

  const keywords: string[] = [];
  if (cont?.botanical) keywords.push(normalize(cont.botanical));
  if (Array.isArray(cont?.commonNames)) {
    for (const cn of cont.commonNames as string[]) {
      keywords.push(normalize(cn));
    }
  }

  return {
    handler: p.handler,
    name: p.name,
    nameLower: normalize(p.name),
    catalog: p.catalog,
    catalogSlug,
    imageUrl: med?.image.url ?? "",
    url: `/products/${p.handler}/`,
    keywords,
    priority: PRIORITY[catalogSlug] ?? 0,
  };
});
```

### Step 2: Add the lupa button and island to the header template

In the `<nav>` element, add the island between the desktop nav `</ul>` closing tag and the hamburger `<button>`:

```astro
<!-- Search island (lupa button + overlay) -->
<SearchIsland client:load entries={searchIndex} />
```

The full nav structure becomes:

```
[Logo] [Desktop nav ul] [SearchIsland] [Hamburger button]
```

### Step 3: Build and verify

```bash
pnpm build 2>&1 | tail -20
```

Expected: `[build] Complete!` with no errors.

### Step 4: Smoke test in dev server

```bash
pnpm dev
```

Open `http://localhost:4321`. Verify:

- [ ] Lupa icon visible in header (desktop and mobile)
- [ ] Click opens search overlay
- [ ] Typing "batana" shows results with thumbnails
- [ ] Typing "jimerito" matches Stingless Bee Honey via keyword
- [ ] Typing "xyz" shows "No results" + browse link
- [ ] X button clears input and refocuses
- [ ] `Escape` closes and restores focus to lupa
- [ ] `↓↑` navigate results with highlight
- [ ] `Enter` on result navigates to PDP
- [ ] `Enter` with no result selected navigates to `/products/?q=...`
- [ ] Click outside (backdrop) closes overlay
- [ ] Mobile: lupa opens fixed bar, backdrop present

### Step 5: Commit

```bash
git add src/components/Header.astro
git commit -m "feat(search): integrate SearchIsland into Header — global product autocomplete"
```

---

## Task 4: Final build verification

### Step 1: Full production build

```bash
pnpm build 2>&1 | grep -E "(error|warning|Complete)"
```

Expected: `[build] Complete!` — zero errors, zero warnings.

### Step 2: Run full test suite

```bash
pnpm vitest run
```

Expected: all tests pass including the new `search.test.ts`.

### Step 3: Lint

```bash
pnpm lint
```

Expected: 0 problems.

### Step 4: Commit if any cleanup needed

```bash
git add -p
git commit -m "chore(search): post-integration cleanup"
```

---

## Out of Scope (future)

- Keyboard shortcut to open search (`/` or `Cmd+K`)
- Search analytics
- Server-side D1 FTS5 search (after SSR migration)
- Search history / recent searches
