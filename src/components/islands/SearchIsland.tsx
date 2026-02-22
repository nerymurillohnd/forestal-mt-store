/**
 * SearchIsland — Header product search autocomplete.
 *
 * Receives a pre-built search index as prop from Header.astro (build time).
 * Filtering runs in memory — zero runtime API calls.
 *
 * Desktop + Mobile: lupa icon → fixed full-screen overlay with input + dropdown.
 * Nav links hidden via .search-open CSS class on <html> while overlay is open.
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

/**
 * Bold the matched portion of the original display name.
 * Finds the match index using normalized strings, slices the original name.
 * Character positions are preserved because NFD normalization + diacritic
 * removal keeps string lengths equal for standard Latin diacritics.
 */
function highlightMatch(name: string, rawQuery: string): preact.JSX.Element {
  const q = normalize(rawQuery.trim());
  if (!q) return <span>{name}</span>;

  const normalizedName = normalize(name);
  const idx = normalizedName.indexOf(q);
  if (idx === -1) return <span>{name}</span>;

  // Use q.length (normalized) for slice end — same char count as original
  // because NFD diacritic removal preserves code unit count for Latin scripts.
  return (
    <span>
      {name.slice(0, idx)}
      <strong class="font-semibold text-charcoal">{name.slice(idx, idx + q.length)}</strong>
      {name.slice(idx + q.length)}
    </span>
  );
}

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

  // Toggle search-open class on <html> to hide nav links via CSS
  // and lock body scroll while overlay is open
  useEffect(() => {
    document.documentElement.classList.toggle("search-open", isOpen);
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.documentElement.classList.remove("search-open");
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Focus input after overlay renders
  useEffect(() => {
    if (isOpen) {
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

  const scrollResultIntoView = useCallback((index: number) => {
    const list = listRef.current;
    if (!list) return;
    const item = list.children[index] as HTMLElement | undefined;
    item?.scrollIntoView({ block: "nearest" });
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
      // Tab: let browser handle focus naturally
    }
  };

  const listboxId = "search-listbox";
  const activeDescendant = highlightedIndex >= 0 ? `search-option-${highlightedIndex}` : undefined;

  return (
    <>
      {/* ── Lupa trigger button ── */}
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
              {/* Search icon (decorative) */}
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
                onKeyDown={handleKeyDown}
                class="min-w-0 flex-1 bg-transparent font-[family-name:var(--font-ui)] text-[15px] text-charcoal placeholder:text-graphite/40 outline-none"
              />

              {/* Clear (X) button */}
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

              {/* Esc label / close */}
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
                        class={`rounded-lg transition-colors ${
                          highlightedIndex === i
                            ? "bg-zinc-100 ring-1 ring-leaf-green/20"
                            : "hover:bg-parchment/60"
                        }`}
                      >
                        <a href={entry.url} class="flex items-center gap-3 px-3 py-2" tabIndex={0}>
                          {/* Thumbnail */}
                          <div class="h-10 w-10 shrink-0 overflow-hidden rounded ring-1 ring-black/5">
                            <img
                              src={`/cdn-cgi/image/width=80,format=auto/${entry.imageUrl}`}
                              alt=""
                              aria-hidden="true"
                              width={40}
                              height={40}
                              loading="eager"
                              class="h-full w-full object-cover"
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
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              d="m9 18 6-6-6-6"
                            />
                          </svg>
                        </a>
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
