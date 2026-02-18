/**
 * AccordionIsland — Interactive accordion with smooth height animation.
 * ARIA compliant, keyboard navigable (Enter/Space).
 */
import { useState } from "preact/hooks";

interface Item {
  title: string;
  content: string;
}

interface Props {
  items: Item[];
  allowMultiple?: boolean;
  variant?: "light" | "dark";
}

export default function AccordionIsland({
  items,
  allowMultiple = false,
  variant = "light",
}: Props) {
  const [open, setOpen] = useState<Set<number>>(new Set());

  const toggle = (index: number) => {
    setOpen((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const isDark = variant === "dark";
  const textColor = isDark ? "text-white" : "text-charcoal";
  const bodyColor = isDark ? "text-white/55" : "text-[#333]/70";
  const borderColor = "border-[#F3C00D]/10";

  return (
    <div class={textColor}>
      {items.map((item, i) => (
        <div key={i} class={`border-b ${borderColor}`}>
          <button
            type="button"
            onClick={() => toggle(i)}
            aria-expanded={open.has(i)}
            class="flex w-full cursor-pointer items-center justify-between py-5 text-left font-[family-name:var(--font-heading)] text-[1rem] font-normal tracking-wide"
          >
            <span>{item.title}</span>
            <svg
              class={`h-4 w-4 shrink-0 text-[#F3C00D]/60 transition-transform duration-300 ${open.has(i) ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              stroke-width="1.5"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="m19.5 8.25-7.5 7.5-7.5-7.5"
              />
            </svg>
          </button>
          <div
            class="grid transition-[grid-template-rows] duration-300 ease-out"
            style={{
              gridTemplateRows: open.has(i) ? "1fr" : "0fr",
            }}
          >
            <div class="overflow-hidden">
              <div
                class={`pb-6 font-[family-name:var(--font-body)] text-[14px] leading-[1.85] ${bodyColor}`}
                dangerouslySetInnerHTML={{ __html: item.content }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
