/**
 * HerbFilterIsland — Filterable botanical catalog with wellness categories.
 * Preact island (client:visible) — replaces HerbScrollIsland.
 * 7 category filters with animated grid transitions.
 */
import { useState } from "preact/hooks";

type Category = "all" | "respiratory" | "digestive" | "immune" | "skin" | "cleansing" | "wellness";

interface Herb {
  name: string;
  localName?: string;
  sku: string;
  description: string;
  image?: string;
  handler: string;
  categories: Category[];
}

interface Props {
  herbs: Herb[];
}

const CATEGORIES: { id: Category; label: string }[] = [
  { id: "all", label: "All Herbs" },
  { id: "respiratory", label: "Respiratory" },
  { id: "digestive", label: "Digestive" },
  { id: "immune", label: "Immune" },
  { id: "skin", label: "Skin & Hair" },
  { id: "cleansing", label: "Cleansing" },
  { id: "wellness", label: "Wellness" },
];

export default function HerbFilterIsland({ herbs }: Props) {
  const [active, setActive] = useState<Category>("all");
  const [animKey, setAnimKey] = useState(0);

  const handleFilter = (cat: Category) => {
    if (cat === active) return;
    setActive(cat);
    setAnimKey((k) => k + 1);
  };

  const filtered = active === "all" ? herbs : herbs.filter((h) => h.categories.includes(active));

  return (
    <div>
      {/* Category pills */}
      <div
        class="flex flex-wrap justify-center gap-2 px-4 mb-4"
        role="group"
        aria-label="Filter herbs by wellness category"
      >
        {CATEGORIES.map((cat) => {
          const count =
            cat.id === "all"
              ? herbs.length
              : herbs.filter((h) => h.categories.includes(cat.id)).length;
          const isActive = active === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => handleFilter(cat.id)}
              aria-pressed={isActive}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "11px",
                letterSpacing: "0.12em",
                borderRadius: "2px",
              }}
              class={`inline-flex items-center gap-2 px-5 py-2.5 border font-semibold uppercase transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#206D03]/40 ${
                isActive
                  ? "bg-[#206D03] border-[#206D03] text-white shadow-[0_2px_8px_rgba(32,109,3,0.22)]"
                  : "bg-white border-[#D6E8D3] text-[#333]/60 hover:border-[#206D03]/40 hover:text-[#206D03]"
              }`}
            >
              {cat.label}
              <span
                style={{ fontSize: "9px", fontWeight: "400" }}
                class={isActive ? "text-white/65" : "text-[#333]/30"}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Count label */}
      <p
        class="text-center mb-10 text-[#333]/35 uppercase tracking-[0.15em]"
        style={{ fontFamily: "var(--font-ui)", fontSize: "10px" }}
        aria-live="polite"
        aria-atomic="true"
      >
        {filtered.length} {filtered.length === 1 ? "variety" : "varieties"} wildcrafted in Honduras
      </p>

      {/* Grid — key change triggers re-mount + CSS animation */}
      <div
        key={animKey}
        class="mx-auto max-w-7xl px-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:px-12"
        style={{ animation: "herb-grid-appear 0.25s ease" }}
        aria-label={`${filtered.length} herbs in ${active === "all" ? "all categories" : active} category`}
      >
        {filtered.map((herb, i) => (
          <a
            key={herb.sku}
            href={`/products/${herb.handler}/`}
            class="group block bg-white border border-[#D6E8D3] shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.08)] hover:border-[#206D03]/25 transition-all duration-200"
            style={{
              textDecoration: "none",
              animation: `herb-card-appear 0.35s ease both`,
              animationDelay: `${Math.min(i * 18, 240)}ms`,
            }}
          >
            {/* Image */}
            <div class="aspect-square overflow-hidden bg-[#F5F0E8] p-4">
              {herb.image ? (
                <img
                  src={`/cdn-cgi/image/width=320,format=auto/${herb.image}`}
                  alt={herb.name}
                  width={320}
                  height={320}
                  class="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <div class="h-full flex items-center justify-center">
                  <span
                    style={{
                      fontFamily: "var(--font-heading)",
                      fontSize: "10px",
                      color: "rgba(26,26,26,0.12)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                    }}
                  >
                    Wildcrafted
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div class="p-4 border-t border-[#D6E8D3]/50">
              <p
                class="mb-1 font-semibold uppercase tracking-[0.18em] text-[#B8960C]"
                style={{ fontFamily: "var(--font-ui)", fontSize: "9px" }}
              >
                {herb.sku}
              </p>
              <h3
                class="font-normal text-[#1A1A1A] leading-tight"
                style={{ fontFamily: "var(--font-heading)", fontSize: "0.9rem" }}
              >
                {herb.name}
              </h3>
              {herb.localName && (
                <p
                  class="mt-0.5 italic text-[#1A1A1A]/40"
                  style={{ fontFamily: "var(--font-body)", fontSize: "11px" }}
                >
                  {herb.localName}
                </p>
              )}
              <p
                class="mt-2 leading-[1.65] text-[#1A1A1A]/55 line-clamp-3"
                style={{ fontFamily: "var(--font-body)", fontSize: "12px" }}
              >
                {herb.description}
              </p>
              <p
                class="mt-3 font-semibold uppercase tracking-[0.12em] text-[#206D03] opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                style={{ fontFamily: "var(--font-ui)", fontSize: "10px" }}
              >
                View Product &rarr;
              </p>
            </div>
          </a>
        ))}
      </div>

      <style>{`
        @keyframes herb-grid-appear {
          from { opacity: 0.5; }
          to   { opacity: 1; }
        }
        @keyframes herb-card-appear {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
