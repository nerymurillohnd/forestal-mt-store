/**
 * ImpactBarIsland — Container for staggered animated counters.
 * Orchestrates CountUp animations with delay between each.
 */
import { useEffect, useRef, useState } from "preact/hooks";

interface Stat {
  target: number;
  label: string;
  prefix?: string;
  suffix?: string;
}

interface Props {
  stats: Stat[];
  staggerMs?: number;
}

function Counter({
  target,
  label,
  prefix = "",
  suffix = "",
  delay = 0,
  trigger,
}: Stat & { delay: number; trigger: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!trigger) return;

    const timeout = setTimeout(() => {
      const duration = 1800;
      const start = performance.now();
      const tick = (now: number) => {
        const progress = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCount(Math.floor(eased * target));
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, delay);

    return () => clearTimeout(timeout);
  }, [trigger, target, delay]);

  return (
    <div class="text-center">
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

export default function ImpactBarIsland({ stats, staggerMs = 200 }: Props) {
  const [trigger, setTrigger] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setTrigger(true);
        observer.disconnect();
      },
      { threshold: 0.2 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} class="grid grid-cols-2 gap-8 py-4 md:grid-cols-4 md:gap-12">
      {stats.map((stat, i) => (
        <Counter key={stat.label} {...stat} delay={i * staggerMs} trigger={trigger} />
      ))}
    </div>
  );
}
