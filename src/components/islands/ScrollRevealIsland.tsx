/**
 * ScrollRevealIsland — Wrapper for fade-in + slide-up on scroll.
 * Progressive enhancement over CSS reveal-on-scroll class.
 */
import { useEffect, useRef, useState } from "preact/hooks";
import type { ComponentChildren } from "preact";

interface Props {
  children: ComponentChildren;
  delay?: number;
  direction?: "up" | "left" | "right";
}

const transforms: Record<string, string> = {
  up: "translateY(32px)",
  left: "translateX(-32px)",
  right: "translateX(32px)",
};

export default function ScrollRevealIsland({
  children,
  delay = 0,
  direction = "up",
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setTimeout(() => setVisible(true), delay);
        observer.disconnect();
      },
      { threshold: 0.15 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "none" : transforms[direction],
        transition: "opacity 0.7s ease, transform 0.7s ease",
      }}
    >
      {children}
    </div>
  );
}
