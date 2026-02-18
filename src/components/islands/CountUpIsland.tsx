/**
 * CountUpIsland — Animated number counter triggered on scroll.
 * Uses IntersectionObserver + requestAnimationFrame. Zero deps.
 */
import { useEffect, useRef, useState } from "preact/hooks";

interface Props {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

export default function CountUpIsland({ target, label, prefix = "", suffix = "" }: Props) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const triggered = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || triggered.current) return;
        triggered.current = true;
        observer.disconnect();

        const duration = 1800;
        const start = performance.now();
        const tick = (now: number) => {
          const progress = Math.min((now - start) / duration, 1);
          const eased = 1 - Math.pow(1 - progress, 3);
          setCount(Math.floor(eased * target));
          if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.3 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <div ref={ref} class="text-center">
      <span class="font-[family-name:var(--font-display)] text-[clamp(2.5rem,5vw,4rem)] leading-none text-white">
        {prefix}
        {count.toLocaleString()}
        {suffix}
      </span>
      <p class="mt-3 font-[family-name:var(--font-ui)] text-[10px] font-semibold uppercase tracking-[0.25em] text-white/40">
        {label}
      </p>
    </div>
  );
}
