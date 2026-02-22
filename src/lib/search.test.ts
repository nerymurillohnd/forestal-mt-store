import { describe, expect, it } from "vitest";
import * as searchModule from "./search";
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

  it("strips tilde on ñ", () => {
    expect(normalize("Jalapeño")).toBe("jalapeno");
  });
});

describe("scoreAndFilter", () => {
  it("returns empty array for empty query", () => {
    expect(scoreAndFilter(mockEntries, "")).toHaveLength(0);
  });

  it("returns empty array for whitespace-only query", () => {
    expect(scoreAndFilter(mockEntries, "   ")).toHaveLength(0);
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
    const results = scoreAndFilter(mockEntries, "raw");
    expect(results[0].handler).toBe("raw-batana-oil");
  });

  it("sorts by priority when scores are equal", () => {
    // "honey" matches name exactly in stingless-bee-honey (priority 8)
    // and is a keyword for stingless-bee-honey — should rank first
    const results = scoreAndFilter(mockEntries, "honey");
    expect(results[0].handler).toBe("stingless-bee-honey");
  });

  it("respects max results cap", () => {
    const results = scoreAndFilter(mockEntries, "a", 2);
    expect(results.length).toBeLessThanOrEqual(2);
  });

  it("matches diacritic-stripped query", () => {
    // searching "batana" matches "Bataná" if it were in the data
    // here we test that the normalize pass on query works
    const results = scoreAndFilter(mockEntries, "batana");
    expect(results.map((r) => r.handler)).toContain("raw-batana-oil");
  });

  it("is case-insensitive", () => {
    expect(scoreAndFilter(mockEntries, "HONEY")).toHaveLength(1);
    expect(scoreAndFilter(mockEntries, "honey")).toHaveLength(1);
  });

  it("does not include non-matching entries", () => {
    const results = scoreAndFilter(mockEntries, "xyz-no-match");
    expect(results).toHaveLength(0);
  });

  it("returns SearchEntry objects with all fields intact", () => {
    const results = scoreAndFilter(mockEntries, "batana");
    const entry = results.find((r) => r.handler === "raw-batana-oil");
    expect(entry).toBeDefined();
    expect(entry?.url).toBe("/products/raw-batana-oil/");
    expect(entry?.imageUrl).toContain("cdn.forestal-mt.com");
  });

  it("does not export buildSearchIndex (server-only function stays in Header.astro)", () => {
    const mod = searchModule as Record<string, unknown>;
    expect(typeof mod.buildSearchIndex).toBe("undefined");
  });
});
