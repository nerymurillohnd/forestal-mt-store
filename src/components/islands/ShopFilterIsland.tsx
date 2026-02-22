/**
 * ShopFilterIsland — Filter sidebar + product grid for the shop page.
 * Receives all 46 products as serialized props (no API calls at runtime).
 * Preact island — hydrated with client:load for immediate grid render.
 */
import { useState, useEffect } from "preact/hooks";

export interface ShopProduct {
  handler: string;
  productGroupId: string;
  name: string;
  catalog: string;
  catalogSlug: string;
  minPrice: number;
  maxPrice: number;
  qualityBadge: string;
  availability: "InStock" | "OutOfStock";
  imageUrl: string;
  imageAlt: string;
  variantCount: number;
  wholesaleAvailable: boolean;
}

interface ShopFilterIslandProps {
  products: ShopProduct[];
  globalMinPrice: number;
  globalMaxPrice: number;
}

const CATALOG_LABELS: Record<string, string> = {
  "batana-oil": "Batana Oil",
  "stingless-bee-honey": "Stingless Bee Honey",
  "traditional-herbs": "Traditional Herbs",
};

const PAGE_SIZE = 24;

export default function ShopFilterIsland({
  products,
  globalMinPrice,
  globalMaxPrice,
}: ShopFilterIslandProps) {
  const [selectedCatalogs, setSelectedCatalogs] = useState<Set<string>>(new Set());
  const [priceMin, setPriceMin] = useState(globalMinPrice);
  const [priceMax, setPriceMax] = useState(globalMaxPrice);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [showCount, setShowCount] = useState(PAGE_SIZE);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  // Scroll lock when mobile filter overlay is open
  useEffect(() => {
    if (mobileFilterOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileFilterOpen]);

  // Reset pagination when filters change
  useEffect(() => {
    setShowCount(PAGE_SIZE);
  }, [selectedCatalogs, priceMin, priceMax, inStockOnly]);

  // Catalog counts (total, not filtered)
  const catalogCounts = products.reduce<Record<string, number>>((acc, p) => {
    acc[p.catalogSlug] = (acc[p.catalogSlug] ?? 0) + 1;
    return acc;
  }, {});

  // Filter logic
  const filtered = products.filter((p) => {
    if (selectedCatalogs.size > 0 && !selectedCatalogs.has(p.catalogSlug)) return false;
    if (p.minPrice > priceMax || p.maxPrice < priceMin) return false;
    if (inStockOnly && p.availability !== "InStock") return false;
    return true;
  });

  const visible = filtered.slice(0, showCount);
  const hasMore = filtered.length > showCount;

  // Active filter count for mobile badge
  const activeFilterCount =
    selectedCatalogs.size +
    (inStockOnly ? 1 : 0) +
    (priceMin !== globalMinPrice || priceMax !== globalMaxPrice ? 1 : 0);

  // Price range handlers — clamp to prevent invalid state
  const handleMinChange = (val: number) => {
    const clamped = Math.min(val, priceMax);
    setPriceMin(Math.max(clamped, globalMinPrice));
  };
  const handleMaxChange = (val: number) => {
    const clamped = Math.max(val, priceMin);
    setPriceMax(Math.min(clamped, globalMaxPrice));
  };

  const toggleCatalog = (slug: string) => {
    setSelectedCatalogs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) {
        next.delete(slug);
      } else {
        next.add(slug);
      }
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedCatalogs(new Set());
    setPriceMin(globalMinPrice);
    setPriceMax(globalMaxPrice);
    setInStockOnly(false);
  };

  const handleAddToCart = (_name: string) => {
    setToast(`Coming soon — cart launching soon!`);
    setTimeout(() => setToast(null), 2000);
  };

  const toggleWishlist = (handler: string) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      if (next.has(handler)) {
        next.delete(handler);
      } else {
        next.add(handler);
      }
      return next;
    });
  };

  // Sidebar filter panel (shared between desktop and mobile overlay)
  const FilterPanel = () => (
    <div class="space-y-6">
      {/* Price Range */}
      <div>
        <h3 class="mb-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-charcoal">
          Price Range
        </h3>
        <div class="flex items-center gap-2">
          <div class="flex-1">
            <p class="mb-1 font-[family-name:var(--font-ui)] text-[11px] text-graphite/50">Min</p>
            <div class="flex items-center rounded border border-gold/20 bg-white px-2 py-1.5">
              <span
                class="font-[family-name:var(--font-ui)] text-xs text-graphite/50"
                aria-hidden="true"
              >
                $
              </span>
              <input
                type="number"
                aria-label="Minimum price"
                min={globalMinPrice}
                max={globalMaxPrice}
                step="0.01"
                value={priceMin}
                onChange={(e) =>
                  handleMinChange(parseFloat((e.target as HTMLInputElement).value) || 0)
                }
                class="w-full bg-transparent font-[family-name:var(--font-ui)] text-xs text-charcoal outline-none"
              />
            </div>
          </div>
          <span
            class="mt-4 font-[family-name:var(--font-ui)] text-xs text-graphite/40"
            aria-hidden="true"
          >
            —
          </span>
          <div class="flex-1">
            <p class="mb-1 font-[family-name:var(--font-ui)] text-[11px] text-graphite/50">Max</p>
            <div class="flex items-center rounded border border-gold/20 bg-white px-2 py-1.5">
              <span
                class="font-[family-name:var(--font-ui)] text-xs text-graphite/50"
                aria-hidden="true"
              >
                $
              </span>
              <input
                type="number"
                aria-label="Maximum price"
                min={globalMinPrice}
                max={globalMaxPrice}
                step="0.01"
                value={priceMax}
                onChange={(e) =>
                  handleMaxChange(parseFloat((e.target as HTMLInputElement).value) || 0)
                }
                class="w-full bg-transparent font-[family-name:var(--font-ui)] text-xs text-charcoal outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div>
        <h3 class="mb-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-charcoal">
          Catalog
        </h3>
        <div class="space-y-2">
          {Object.entries(CATALOG_LABELS).map(([slug, label]) => (
            <label
              key={slug}
              class="flex cursor-pointer items-center gap-2.5 font-[family-name:var(--font-ui)] text-sm text-graphite"
            >
              <input
                type="checkbox"
                checked={selectedCatalogs.has(slug)}
                onChange={() => toggleCatalog(slug)}
                class="h-3.5 w-3.5 cursor-pointer accent-leaf-green"
              />
              <span>{label}</span>
              <span class="ml-auto text-[11px] text-graphite/40">({catalogCounts[slug] ?? 0})</span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability */}
      <div>
        <h3 class="mb-3 font-[family-name:var(--font-heading)] text-xs uppercase tracking-widest text-charcoal">
          Availability
        </h3>
        <label class="flex cursor-pointer items-center gap-2.5 font-[family-name:var(--font-ui)] text-sm text-graphite">
          <input
            type="checkbox"
            checked={inStockOnly}
            onChange={() => setInStockOnly((v) => !v)}
            class="h-3.5 w-3.5 cursor-pointer accent-leaf-green"
          />
          <span>In Stock Only</span>
        </label>
      </div>

      {/* Clear filters */}
      {activeFilterCount > 0 && (
        <button
          type="button"
          onClick={clearFilters}
          class="w-full rounded border border-charcoal/20 py-2 font-[family-name:var(--font-ui)] text-xs text-graphite/70 transition-colors hover:border-charcoal/40 hover:text-charcoal"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );

  return (
    <div class="relative">
      {/* Toast notification */}
      {toast && (
        <div class="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-full bg-charcoal px-5 py-2.5 font-[family-name:var(--font-ui)] text-sm text-white shadow-lg">
          {toast}
        </div>
      )}

      {/* Mobile filter toggle bar */}
      <div class="mb-4 flex items-center justify-between lg:hidden">
        <button
          type="button"
          onClick={() => setMobileFilterOpen(true)}
          class="flex items-center gap-2 rounded border border-charcoal/20 px-4 py-2 font-[family-name:var(--font-ui)] text-sm text-charcoal transition-colors hover:border-charcoal/40"
        >
          <svg
            class="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              d="M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591L15.75 12.5v6.75l-7.5-3V12.5L2.659 7.409A2.25 2.25 0 0 1 2 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"
            />
          </svg>
          Filters
          {activeFilterCount > 0 && (
            <span class="rounded-full bg-leaf-green px-1.5 py-0.5 text-[10px] font-medium text-white">
              {activeFilterCount}
            </span>
          )}
        </button>
        <span class="font-[family-name:var(--font-ui)] text-sm text-graphite/60">
          {filtered.length} of {products.length} products
        </span>
      </div>

      {/* Mobile filter overlay */}
      {mobileFilterOpen && (
        <div class="fixed inset-0 z-40 lg:hidden">
          {/* Backdrop */}
          <button
            type="button"
            class="absolute inset-0 cursor-default bg-charcoal/50"
            onClick={() => setMobileFilterOpen(false)}
            aria-label="Close filters"
          />
          {/* Panel */}
          <div class="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-parchment p-6 shadow-xl">
            <div class="mb-5 flex items-center justify-between">
              <h2 class="font-[family-name:var(--font-heading)] text-sm uppercase tracking-widest text-charcoal">
                Filters
              </h2>
              <button
                type="button"
                onClick={() => setMobileFilterOpen(false)}
                class="text-graphite/60 transition-colors hover:text-charcoal"
                aria-label="Close filters"
              >
                <svg
                  class="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  stroke-width="1.5"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <FilterPanel />
            <button
              type="button"
              onClick={() => setMobileFilterOpen(false)}
              class="mt-6 w-full rounded bg-leaf-green py-3 font-[family-name:var(--font-ui)] text-sm font-medium text-white transition-colors hover:bg-grass-green"
            >
              Show {filtered.length} Results
            </button>
          </div>
        </div>
      )}

      {/* Desktop layout */}
      <div class="flex gap-8">
        {/* Sidebar — desktop only */}
        <aside class="hidden w-[260px] shrink-0 lg:block">
          <FilterPanel />
        </aside>

        {/* Grid area */}
        <div class="min-w-0 flex-1">
          {/* Result count — desktop */}
          <div class="mb-5 hidden items-center justify-between lg:flex">
            <p class="font-[family-name:var(--font-ui)] text-sm text-graphite/60">
              Showing <span class="font-medium text-charcoal">{visible.length}</span> of{" "}
              <span class="font-medium text-charcoal">{filtered.length}</span> products
            </p>
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                class="font-[family-name:var(--font-ui)] text-xs text-graphite/50 underline underline-offset-2 transition-colors hover:text-charcoal"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Product grid */}
          {visible.length === 0 ? (
            <div class="py-20 text-center">
              <p class="font-[family-name:var(--font-heading)] text-lg text-charcoal/60">
                No products match your filters.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                class="mt-4 font-[family-name:var(--font-ui)] text-sm text-leaf-green underline underline-offset-2"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div class="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
              {visible.map((p) => (
                <ProductCard
                  key={p.handler}
                  product={p}
                  isWishlisted={wishlisted.has(p.handler)}
                  onAddToCart={() => handleAddToCart(p.name)}
                  onToggleWishlist={() => toggleWishlist(p.handler)}
                />
              ))}
            </div>
          )}

          {/* Load more */}
          {hasMore && (
            <div class="mt-8 text-center">
              <button
                type="button"
                onClick={() => setShowCount((c) => c + PAGE_SIZE)}
                class="rounded border border-charcoal/20 px-8 py-3 font-[family-name:var(--font-ui)] text-sm text-charcoal transition-colors hover:border-leaf-green hover:text-leaf-green"
              >
                Show {Math.min(PAGE_SIZE, filtered.length - showCount)} More
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Product Card ────────────────────────────────────────────────────────────

interface ProductCardProps {
  product: ShopProduct;
  isWishlisted: boolean;
  onAddToCart: () => void;
  onToggleWishlist: () => void;
}

function ProductCard({ product, isWishlisted, onAddToCart, onToggleWishlist }: ProductCardProps) {
  const {
    handler,
    productGroupId,
    name,
    minPrice,
    qualityBadge,
    availability,
    imageUrl,
    imageAlt,
    wholesaleAvailable,
  } = product;

  const isInStock = availability === "InStock";
  const optimizedSrc = imageUrl ? `/cdn-cgi/image/width=400,format=auto/${imageUrl}` : "";

  return (
    <div class="group flex flex-col overflow-hidden rounded-lg border border-charcoal/8 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      {/* Image — full card link */}
      <a
        href={`/products/${handler}/`}
        class="relative block aspect-square overflow-hidden bg-parchment"
        tabIndex={-1}
        aria-hidden="true"
      >
        {optimizedSrc && (
          <img
            src={optimizedSrc}
            alt={imageAlt}
            width={400}
            height={400}
            loading="lazy"
            class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {/* Stock badge */}
        <span
          class={`absolute right-2 top-2 flex items-center gap-1 rounded-full px-2 py-0.5 font-[family-name:var(--font-ui)] text-[10px] font-medium ${
            isInStock ? "bg-white/90 text-leaf-green" : "bg-white/90 text-graphite/50"
          }`}
        >
          <span
            class={`h-1.5 w-1.5 rounded-full ${isInStock ? "bg-leaf-green" : "bg-graphite/30"}`}
          />
          {isInStock ? "In Stock" : "Out of Stock"}
        </span>
      </a>

      {/* Body */}
      <div class="flex flex-1 flex-col p-3 sm:p-4">
        {/* Product ID */}
        <p class="mb-1 font-[family-name:var(--font-ui)] text-[10px] uppercase tracking-wider text-graphite/40">
          {productGroupId}
        </p>

        {/* Name — links to PDP */}
        <a href={`/products/${handler}/`} class="mb-2 block">
          <h3 class="font-[family-name:var(--font-heading)] text-xs leading-snug text-charcoal transition-colors hover:text-leaf-green sm:text-sm">
            {name}
          </h3>
        </a>

        {/* Quality badge */}
        {qualityBadge && (
          <span class="mb-2 inline-block self-start rounded bg-parchment px-1.5 py-0.5 font-[family-name:var(--font-ui)] text-[10px] text-gold-dark">
            {qualityBadge}
          </span>
        )}

        {/* Rating stars (static placeholder) */}
        <div
          class="mb-1.5 flex items-center gap-0.5"
          aria-label="5 out of 5 stars — pending reviews"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <svg
              key={i}
              class="h-3 w-3 text-gold"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
        </div>

        {/* Brand */}
        <p class="mb-2 font-[family-name:var(--font-ui)] text-[10px] text-graphite/50">
          Forestal MT
        </p>

        {/* Wholesale badge */}
        {wholesaleAvailable && (
          <span class="mb-2 inline-block self-start rounded bg-leaf-green/10 px-1.5 py-0.5 font-[family-name:var(--font-ui)] text-[10px] text-leaf-green">
            Wholesale Available
          </span>
        )}

        {/* Price */}
        <p class="mb-3 font-[family-name:var(--font-ui)] text-sm font-medium text-charcoal">
          From ${minPrice.toFixed(2)}
        </p>

        {/* Action row */}
        <div class="mt-auto flex items-center gap-2">
          <button
            type="button"
            onClick={onAddToCart}
            disabled={!isInStock}
            class={`flex-1 rounded py-2 font-[family-name:var(--font-ui)] text-xs font-medium transition-colors ${
              isInStock
                ? "bg-leaf-green text-white hover:bg-grass-green"
                : "cursor-not-allowed bg-charcoal/10 text-graphite/40"
            }`}
          >
            {isInStock ? "Add to Cart" : "Out of Stock"}
          </button>
          <button
            type="button"
            onClick={onToggleWishlist}
            aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
            class="rounded border border-charcoal/15 p-2 text-graphite/40 transition-colors hover:border-gold/40 hover:text-gold"
          >
            <svg
              class="h-4 w-4"
              viewBox="0 0 24 24"
              fill={isWishlisted ? "currentColor" : "none"}
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
