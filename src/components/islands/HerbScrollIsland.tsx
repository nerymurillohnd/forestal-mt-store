/**
 * HerbScrollIsland — Horizontal botanical catalog.
 * Preact island (client:visible) replacing the 4-column herb grid.
 * CSS scroll-snap with grab-to-scroll on desktop.
 */
import { useRef, useState, useEffect } from 'preact/hooks';

interface Herb {
  name: string;
  localName?: string;
  sku: string;
  description: string;
}

interface Props {
  herbs: Herb[];
}

export default function HerbScrollIsland({ herbs }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 10);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateScrollState, { passive: true });
    updateScrollState();
    return () => el.removeEventListener('scroll', updateScrollState);
  }, []);

  // Desktop drag-to-scroll
  const onMouseDown = (e: MouseEvent) => {
    const el = scrollRef.current;
    if (!el) return;
    setIsDragging(true);
    setStartX(e.pageX - el.offsetLeft);
    setScrollLeft(el.scrollLeft);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    const el = scrollRef.current;
    if (!el) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - startX) * 1.5;
    el.scrollLeft = scrollLeft - walk;
  };

  const onMouseUp = () => setIsDragging(false);

  const scrollTo = (direction: 'left' | 'right') => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 296; // min-w-[280px] + gap
    el.scrollBy({ left: direction === 'right' ? cardWidth * 2 : -cardWidth * 2, behavior: 'smooth' });
  };

  return (
    <div class="relative">
      {/* Scroll hint */}
      <p
        class="mb-6 text-center text-[11px] uppercase tracking-[0.15em] text-charcoal/40"
        style={{ fontFamily: 'var(--font-ui)' }}
      >
        &larr; Drag to explore {herbs.length} varieties &rarr;
      </p>

      {/* Navigation arrows */}
      <button
        onClick={() => scrollTo('left')}
        class={`absolute left-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition-opacity ${
          canScrollLeft ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } hidden lg:block`}
        aria-label="Scroll left"
      >
        <svg class="h-5 w-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>
      <button
        onClick={() => scrollTo('right')}
        class={`absolute right-0 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-md transition-opacity ${
          canScrollRight ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } hidden lg:block`}
        aria-label="Scroll right"
      >
        <svg class="h-5 w-5 text-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
        </svg>
      </button>

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        class="scroll-snap-x flex gap-4 px-2 pb-4 lg:px-8"
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        role="list"
        aria-label="Botanical herb catalog"
      >
        {herbs.map((herb) => (
          <div
            key={herb.sku}
            class="min-w-[280px] max-w-[280px] shrink-0 border-l-[2px] border-gold/30 bg-white p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] select-none"
            role="listitem"
          >
            {/* Placeholder image area */}
            <div class="aspect-[4/3] rounded-[2px] bg-soft-silver mb-4 flex items-center justify-center">
              <svg class="h-10 w-10 text-charcoal/10" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="0.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
              </svg>
            </div>

            <h3
              class="text-[0.95rem] font-normal text-charcoal"
              style={{ fontFamily: 'var(--font-heading)' }}
            >
              {herb.name}
            </h3>
            {herb.localName && (
              <p class="botanical-name mt-0.5">
                {herb.localName}
              </p>
            )}
            <p
              class="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold-dark"
              style={{ fontFamily: 'var(--font-ui)' }}
            >
              {herb.sku}
            </p>
            <p
              class="mt-2 text-[12px] leading-[1.7] text-charcoal/55"
              style={{ fontFamily: 'var(--font-body)' }}
            >
              {herb.description}
            </p>
          </div>
        ))}
      </div>

      {/* Fade edges */}
      <div class="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-seasalt to-transparent hidden lg:block"></div>
      <div class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-seasalt to-transparent hidden lg:block"></div>
    </div>
  );
}
