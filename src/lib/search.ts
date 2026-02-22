/**
 * Search utility for header autocomplete.
 * Pure functions — no side effects, no imports from Astro/Preact.
 * Tree-shaken safely: only normalize + scoreAndFilter ship to the client bundle.
 */

export interface SearchEntry {
  handler: string;
  name: string;
  /** Pre-normalized at build time: lowercase + diacritics stripped. */
  nameLower: string;
  catalog: string;
  catalogSlug: string;
  imageUrl: string;
  url: string;
  /** Botanical name + common names, pre-normalized at build time. */
  keywords: string[];
  /** 0–10. Higher = appears first when scores are tied. */
  priority: number;
}

/**
 * Lowercase + strip NFD combining diacritics.
 * Apply at build time to SearchEntry.nameLower and keywords.
 * Apply at runtime to the query string only.
 */
export function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Score entries against a query and return up to maxResults sorted results.
 *
 * Scoring:
 *   nameLower starts with q  → +3
 *   nameLower includes q     → +2
 *   any keyword includes q   → +1 (only if name didn't match)
 *
 * Ties broken by entry.priority DESC.
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
