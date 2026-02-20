/**
 * BatanaBenefitsIsland — Interactive tabbed benefits showcase.
 * Tabs: Hair | Skin | Beard. Keyboard accessible, ARIA, reduced-motion aware.
 */
import { useEffect, useRef, useState } from "preact/hooks";

interface Category {
  label: string;
  items: string[];
}

interface Props {
  categories: Category[];
  disclaimer?: string;
}

export default function BatanaBenefitsIsland({ categories, disclaimer }: Props) {
  const [active, setActive] = useState(0);
  const [prefersReduced, setPrefersReduced] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReduced(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  function handleKeyDown(e: KeyboardEvent, index: number) {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % categories.length;
      setActive(next);
      tabRefs.current[next]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + categories.length) % categories.length;
      setActive(prev);
      tabRefs.current[prev]?.focus();
    }
  }

  return (
    <div class="mx-auto max-w-3xl px-6 lg:px-12">
      {/* Tab bar */}
      <div
        role="tablist"
        aria-label="Benefits by category"
        class="flex justify-center gap-2 border-b border-[#333]/10"
      >
        {categories.map((cat, i) => (
          <button
            key={cat.label}
            role="tab"
            aria-selected={active === i}
            aria-controls={`panel-${i}`}
            id={`tab-${i}`}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => handleKeyDown(e as KeyboardEvent, i)}
            class={[
              "relative px-6 pb-4 pt-2 font-[family-name:var(--font-heading)] text-[11px] uppercase tracking-[0.25em] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#F3C00D]",
              active === i
                ? "text-[#333] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-[#F3C00D]"
                : "text-[#333]/40 hover:text-[#333]/70",
            ].join(" ")}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Panels */}
      {categories.map((cat, i) => (
        <div
          key={cat.label}
          role="tabpanel"
          id={`panel-${i}`}
          aria-labelledby={`tab-${i}`}
          hidden={active !== i}
          class="mt-10"
        >
          <ul class="space-y-4">
            {cat.items.map((item, j) => (
              <li
                key={item}
                class="flex items-start gap-4"
                style={
                  prefersReduced
                    ? {}
                    : {
                        opacity: active === i ? 1 : 0,
                        transform: active === i ? "translateY(0)" : "translateY(6px)",
                        transition: `opacity 300ms ease ${j * 60}ms, transform 300ms ease ${j * 60}ms`,
                      }
                }
              >
                <span
                  class="mt-[0.45em] block h-px w-4 shrink-0 bg-[#A18500]/60"
                  aria-hidden="true"
                />
                <span class="font-[family-name:var(--font-body)] text-[14px] leading-[1.8] text-[#333]/70">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      {/* Disclaimer */}
      {disclaimer && (
        <p class="mt-10 text-center font-[family-name:var(--font-body)] text-[12px] italic text-[#333]/30">
          {disclaimer}
        </p>
      )}
    </div>
  );
}
