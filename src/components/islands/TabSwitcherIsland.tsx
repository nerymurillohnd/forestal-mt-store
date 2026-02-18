/**
 * TabSwitcherIsland — Tabbed content panel.
 * ARIA tabpanel, keyboard navigation (Arrow keys).
 */
import { useState } from "preact/hooks";

interface Tab {
  label: string;
  content: string;
}

interface Props {
  tabs: Tab[];
  variant?: "light" | "dark";
}

export default function TabSwitcherIsland({ tabs, variant = "dark" }: Props) {
  const [active, setActive] = useState(0);

  const isDark = variant === "dark";
  const bodyColor = isDark ? "text-white/55" : "text-[#333]/70";
  const tabInactive = isDark ? "text-white/40" : "text-[#333]/40";
  const tabActive = isDark ? "text-white" : "text-charcoal";

  const handleKeyDown = (e: KeyboardEvent, index: number) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setActive((index + 1) % tabs.length);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setActive((index - 1 + tabs.length) % tabs.length);
    }
  };

  return (
    <div>
      {/* Tab bar */}
      <div role="tablist" class="flex gap-1 border-b border-[#F3C00D]/10">
        {tabs.map((tab, i) => (
          <button
            key={i}
            role="tab"
            type="button"
            aria-selected={active === i}
            tabIndex={active === i ? 0 : -1}
            onClick={() => setActive(i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            class={`cursor-pointer border-b-2 px-6 py-3 font-[family-name:var(--font-ui)] text-[12px] font-semibold uppercase tracking-[0.15em] transition-all duration-300 ${
              active === i
                ? `${tabActive} border-[#F3C00D]`
                : `${tabInactive} border-transparent hover:text-white/60`
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab panels */}
      {tabs.map((tab, i) => (
        <div
          key={i}
          role="tabpanel"
          hidden={active !== i}
          class={`pt-8 font-[family-name:var(--font-body)] text-[14px] leading-[1.85] ${bodyColor}`}
          dangerouslySetInnerHTML={{ __html: tab.content }}
        />
      ))}
    </div>
  );
}
