# About Page Completion — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 16 new components (11 Astro + 5 Preact islands) and complete the About page with all missing content from the MDX source, integrating 5 R2 botanical images.

**Architecture:** New components follow existing patterns (SectionHeader, GoldTopCard, DarkFrostedCard). Astro for static layout, Preact islands for scroll-triggered animation and interactive state. CSS-only where possible. Zero external animation dependencies.

**Tech Stack:** Astro 5.7+, Preact, Tailwind CSS 4, Cloudflare Image Resizing, IntersectionObserver API

**R2 Image Base URL:** `https://cdn.forestal-mt.com/pages/about/`

| Image | Used In |
|-------|---------|
| `sourced-from-origin.jpg` | BotanicalSection "We Are The Source" |
| `indiginuos-partner.jpg` | ImpactBar background |
| `the-founder-legacy.jpg` | Leadership grid |
| `murillo-tejada-family.jpg` | SplitEditorial "Our Story" + PullQuote |
| `ethnobotanical-collections.jpg` | "How We Sell" + SloganBanner |

---

## Phase 1: Foundation Astro Components

### Task 1: BotanicalSection.astro

**Files:**
- Create: `src/components/BotanicalSection.astro`

**Step 1: Create component**

```astro
---
/**
 * BotanicalSection — Full-width section with R2 botanical image background.
 * Gradient overlay + slot content. Used for immersive botanical sections.
 */
interface Props {
  image: string;
  alt?: string;
  overlay?: string;
  class?: string;
}

const {
  image,
  alt = "",
  overlay = "from-charcoal/85 via-charcoal/50 to-charcoal/30",
  class: className = "",
} = Astro.props;
---

<section class:list={["grain relative overflow-hidden py-24", className]}>
  <img
    src={image}
    alt={alt}
    class="absolute inset-0 h-full w-full object-cover"
    loading="lazy"
    decoding="async"
  />
  <div class:list={["absolute inset-0 bg-gradient-to-t", overlay]} />
  <div class="relative z-10">
    <slot />
  </div>
</section>
```

**Step 2: Verify build**

Run: `pnpm build`
Expected: PASS (component not yet imported anywhere)

**Step 3: Commit**

```bash
git add src/components/BotanicalSection.astro
git commit -m "feat: add BotanicalSection component for R2 image backgrounds"
```

---

### Task 2: GlassCard.astro

**Files:**
- Create: `src/components/GlassCard.astro`

**Step 1: Create component**

```astro
---
/**
 * GlassCard — Semi-transparent frosted card for dark/botanical backgrounds.
 * Matches DarkFrostedCard pattern but designed for botanical overlays.
 */
interface Props {
  number?: string;
  eyebrow?: string;
  heading: string;
  body: string;
}

const { number, eyebrow, heading, body } = Astro.props;
---

<div class="rounded-[2px] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-sm frosted-hover">
  {
    number && (
      <span class="font-[family-name:var(--font-display)] text-[2rem] leading-none text-[#F3C00D]/30">
        {number}
      </span>
    )
  }
  {
    eyebrow && (
      <p
        class:list={[
          "font-[family-name:var(--font-heading)] text-[9px] font-normal uppercase tracking-[0.3em] text-[#F3C00D]/60",
          number ? "mt-3" : "",
        ]}
      >
        {eyebrow}
      </p>
    )
  }
  <h3
    class:list={[
      "font-[family-name:var(--font-heading)] text-[1.05rem] font-normal tracking-wide text-white",
      number || eyebrow ? "mt-2" : "",
    ]}
  >
    {heading}
  </h3>
  <div class="mt-3 h-px w-8 bg-[#F3C00D]/20"></div>
  <p class="mt-4 font-[family-name:var(--font-body)] text-[13px] leading-[1.85] text-white/55">
    {body}
  </p>
  <slot />
</div>
```

**Step 2: Commit**

```bash
git add src/components/GlassCard.astro
git commit -m "feat: add GlassCard component for botanical sections"
```

---

### Task 3: FeatureList.astro

**Files:**
- Create: `src/components/FeatureList.astro`

**Step 1: Create component**

```astro
---
/**
 * FeatureList — Styled bullet list with gold dash markers.
 * Replaces inline <ul> patterns across pages.
 */
interface Props {
  items: string[];
  variant?: "light" | "dark";
}

const { items, variant = "light" } = Astro.props;

const textColor = variant === "dark" ? "text-white/60" : "text-[#333]/70";
const markerColor = variant === "dark" ? "bg-[#F3C00D]/40" : "bg-[#F3C00D]/50";
---

<ul class="space-y-4">
  {
    items.map((item) => (
      <li
        class:list={[
          "flex items-start gap-4 font-[family-name:var(--font-body)] text-[14px] leading-relaxed",
          textColor,
        ]}
      >
        <span class:list={["mt-2.5 h-px w-5 shrink-0", markerColor]} />
        <span set:html={item} />
      </li>
    ))
  }
</ul>
```

**Step 2: Commit**

```bash
git add src/components/FeatureList.astro
git commit -m "feat: add FeatureList component with gold dash markers"
```

---

### Task 4: AccordionItem.astro + AccordionGroup.astro

**Files:**
- Create: `src/components/AccordionItem.astro`
- Create: `src/components/AccordionGroup.astro`

**Step 1: Create AccordionItem**

```astro
---
/**
 * AccordionItem — CSS-only expandable section using <details>/<summary>.
 * Zero JS, ARIA accessible. Gold chevron rotates on open.
 */
interface Props {
  title: string;
  open?: boolean;
}

const { title, open = false } = Astro.props;
---

<details class="group border-b border-[#F3C00D]/10" open={open}>
  <summary class="flex cursor-pointer items-center justify-between py-5 font-[family-name:var(--font-heading)] text-[1rem] font-normal tracking-wide select-none [&::-webkit-details-marker]:hidden">
    <span>{title}</span>
    <svg
      class="h-4 w-4 shrink-0 text-[#F3C00D]/60 transition-transform duration-300 group-open:rotate-180"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      stroke-width="1.5"
    >
      <path stroke-linecap="round" stroke-linejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
    </svg>
  </summary>
  <div class="pb-6 font-[family-name:var(--font-body)] text-[14px] leading-[1.85]">
    <slot />
  </div>
</details>
```

**Step 2: Create AccordionGroup**

```astro
---
/**
 * AccordionGroup — Container for AccordionItems with consistent spacing.
 */
interface Props {
  variant?: "light" | "dark";
}

const { variant = "light" } = Astro.props;

const textColor = variant === "dark" ? "text-white" : "text-charcoal";
---

<div class:list={["divide-y divide-[#F3C00D]/10", textColor]}>
  <slot />
</div>
```

**Step 3: Commit**

```bash
git add src/components/AccordionItem.astro src/components/AccordionGroup.astro
git commit -m "feat: add AccordionItem and AccordionGroup (CSS-only, zero JS)"
```

---

## Phase 2: Editorial Astro Components

### Task 5: SplitEditorial.astro

**Files:**
- Create: `src/components/SplitEditorial.astro`

**Step 1: Create component**

Based on OriginChapter pattern but editorial-focused (no metadata grid).

```astro
---
/**
 * SplitEditorial — 50/50 image + text editorial block.
 * Simpler than OriginChapter — no metadata, pure narrative.
 */
interface Props {
  eyebrow?: string;
  heading: string;
  paragraphs: string[];
  image: string;
  imageAlt?: string;
  direction?: "left" | "right";
  variant?: "light" | "dark";
}

const {
  eyebrow,
  heading,
  paragraphs,
  image,
  imageAlt = "",
  direction = "left",
  variant = "light",
} = Astro.props;

const imageFirst = direction === "left";
const isDark = variant === "dark";

const eyebrowColor = isDark ? "text-[#F3C00D]/80" : "text-gold-dark";
const headingColor = isDark ? "text-white" : "text-charcoal";
const textColor = isDark ? "text-white/55" : "text-[#333]/70";
---

<div
  class:list={[
    "mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-6 lg:grid-cols-2 lg:gap-16 lg:px-12",
  ]}
>
  {/* Image */}
  <div
    class:list={[
      "relative aspect-[4/5] overflow-hidden rounded-[2px]",
      imageFirst ? "lg:order-1" : "lg:order-2",
    ]}
  >
    <img
      src={image}
      alt={imageAlt}
      class="parallax-image h-full w-full object-cover"
      loading="lazy"
      decoding="async"
    />
    <div class="absolute inset-0 rounded-[2px] ring-1 ring-inset ring-[#F3C00D]/10"></div>
  </div>

  {/* Text */}
  <div class:list={["reveal-on-scroll", imageFirst ? "lg:order-2" : "lg:order-1"]}>
    {
      eyebrow && (
        <p
          class:list={[
            "font-[family-name:var(--font-heading)] text-[11px] font-normal uppercase tracking-[0.35em]",
            eyebrowColor,
          ]}
        >
          {eyebrow}
        </p>
      )
    }
    <h2
      class:list={[
        "mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.5vw,2.5rem)] font-normal",
        headingColor,
      ]}
      set:html={heading}
    />
    <hr class="gold-rule-left" />
    {
      paragraphs.map((p) => (
        <p
          class:list={[
            "mt-4 first:mt-8 font-[family-name:var(--font-body)] text-[15px] leading-[1.85]",
            textColor,
          ]}
          set:html={p}
        />
      ))
    }
    <slot />
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/components/SplitEditorial.astro
git commit -m "feat: add SplitEditorial component for image+text blocks"
```

---

### Task 6: PullQuote.astro

**Files:**
- Create: `src/components/PullQuote.astro`

**Step 1: Create component**

```astro
---
/**
 * PullQuote — Full-width editorial quote separator.
 * Large serif italic text with gold decorative marks.
 */
interface Props {
  quote: string;
  attribution?: string;
  variant?: "light" | "dark";
}

const { quote, attribution, variant = "light" } = Astro.props;

const isDark = variant === "dark";
const quoteColor = isDark ? "text-white/80" : "text-charcoal/80";
const markColor = isDark ? "text-[#F3C00D]/30" : "text-[#F3C00D]/40";
const attrColor = isDark ? "text-white/40" : "text-charcoal/40";
const bgClass = isDark ? "bg-charcoal" : "surface-parchment";
---

<section class:list={["py-20 md:py-28", bgClass]}>
  <div class="reveal-on-scroll mx-auto max-w-3xl px-6 text-center lg:px-12">
    <span class:list={["font-[family-name:var(--font-display)] text-[3rem] leading-none", markColor]}
      >&ldquo;</span
    >
    <blockquote
      class:list={[
        "mt-2 font-[family-name:var(--font-body)] text-[clamp(1.15rem,2.2vw,1.5rem)] font-normal italic leading-[1.7]",
        quoteColor,
      ]}
      set:html={quote}
    />
    {
      attribution && (
        <p class:list={["mt-6 font-[family-name:var(--font-ui)] text-[12px] uppercase tracking-[0.2em]", attrColor]}>
          <span class="mr-2 inline-block h-px w-4 align-middle bg-[#F3C00D]/40" />
          {attribution}
        </p>
      )
    }
  </div>
</section>
```

**Step 2: Commit**

```bash
git add src/components/PullQuote.astro
git commit -m "feat: add PullQuote component for editorial quotes"
```

---

### Task 7: SloganBanner.astro

**Files:**
- Create: `src/components/SloganBanner.astro`

**Step 1: Create component**

```astro
---
/**
 * SloganBanner — Full-width brand statement with botanical background.
 * Large display typography, gold decorative lines.
 */
import BotanicalSection from "./BotanicalSection.astro";

interface Props {
  slogan: string;
  description?: string;
  image?: string;
}

const { slogan, description, image } = Astro.props;
---

{
  image ? (
    <BotanicalSection image={image} alt="Botanical background" overlay="from-charcoal/90 via-charcoal/70 to-charcoal/60">
      <div class="reveal-on-scroll mx-auto max-w-3xl px-6 text-center lg:px-12">
        <div class="mx-auto h-px w-12 bg-gradient-to-r from-transparent via-[#F3C00D]/50 to-transparent" />
        <p class="mt-8 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,3rem)] font-normal leading-tight text-white">
          {slogan}
        </p>
        <div class="mx-auto mt-8 h-px w-12 bg-gradient-to-r from-transparent via-[#F3C00D]/50 to-transparent" />
        {description && (
          <p class="mx-auto mt-8 max-w-xl font-[family-name:var(--font-body)] text-[15px] leading-[1.85] text-white/50">
            {description}
          </p>
        )}
      </div>
    </BotanicalSection>
  ) : (
    <section class="surface-dark grain relative py-20 md:py-28">
      <div class="reveal-on-scroll relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-12">
        <div class="mx-auto h-px w-12 bg-gradient-to-r from-transparent via-[#F3C00D]/50 to-transparent" />
        <p class="mt-8 font-[family-name:var(--font-display)] text-[clamp(1.75rem,4vw,3rem)] font-normal leading-tight text-white">
          {slogan}
        </p>
        <div class="mx-auto mt-8 h-px w-12 bg-gradient-to-r from-transparent via-[#F3C00D]/50 to-transparent" />
        {description && (
          <p class="mx-auto mt-8 max-w-xl font-[family-name:var(--font-body)] text-[15px] leading-[1.85] text-white/50">
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/SloganBanner.astro
git commit -m "feat: add SloganBanner component for brand statements"
```

---

### Task 8: DualCTASection.astro

**Files:**
- Create: `src/components/DualCTASection.astro`

**Step 1: Create component**

```astro
---
/**
 * DualCTASection — Closing section with 2 CTAs.
 * Replaces inline Partner CTA pattern across pages.
 */
interface Props {
  eyebrow?: string;
  heading: string;
  description?: string;
  primaryCta: { label: string; url: string };
  secondaryCta?: { label: string; url: string };
  variant?: "green" | "dark";
}

const {
  eyebrow,
  heading,
  description,
  primaryCta,
  secondaryCta,
  variant = "green",
} = Astro.props;

const bgClass = variant === "green" ? "bg-[#206D03]" : "bg-charcoal";
---

<section class:list={["grain relative overflow-hidden py-24", bgClass]}>
  <div class="reveal-on-scroll relative z-10 mx-auto max-w-3xl px-6 text-center lg:px-12">
    {
      eyebrow && (
        <p class="font-[family-name:var(--font-heading)] text-[11px] font-normal uppercase tracking-[0.35em] text-[#F3C00D]/80">
          {eyebrow}
        </p>
      )
    }
    <h2 class="mt-4 font-[family-name:var(--font-display)] text-[clamp(1.75rem,3.5vw,2.5rem)] font-normal text-white">
      {heading}
    </h2>
    {
      description && (
        <p class="mx-auto mt-6 max-w-2xl font-[family-name:var(--font-body)] text-[15px] leading-[1.85] text-white/60"
          set:html={description}
        />
      )
    }
    <div class="mt-10 flex flex-wrap justify-center gap-4">
      <a
        href={primaryCta.url}
        class="inline-block rounded-[3px] bg-[#F3C00D] px-8 py-3.5 font-[family-name:var(--font-ui)] text-[13px] font-semibold text-[#333] transition-all duration-300 hover:bg-[#F3C00D]/90 hover:shadow-lg hover:shadow-[#F3C00D]/20"
      >
        {primaryCta.label}
      </a>
      {
        secondaryCta && (
          <a
            href={secondaryCta.url}
            class="inline-block rounded-[3px] border border-white/25 px-8 py-3.5 font-[family-name:var(--font-ui)] text-[13px] font-semibold text-white/90 transition-all duration-300 hover:border-white/50 hover:bg-white/5"
          >
            {secondaryCta.label}
          </a>
        )
      }
    </div>
  </div>
</section>
```

**Step 2: Commit**

```bash
git add src/components/DualCTASection.astro
git commit -m "feat: add DualCTASection component for closing CTAs"
```

---

## Phase 3: Specialized Astro Components

### Task 9: LeadershipCard.astro

**Files:**
- Create: `src/components/LeadershipCard.astro`

**Step 1: Create component**

```astro
---
/**
 * LeadershipCard — Team member card with photo area + details.
 * Gold top accent matching GoldTopCard pattern.
 */
interface Props {
  name: string;
  title: string;
  bio: string;
  image?: string;
}

const { name, title, bio, image } = Astro.props;
---

<div class="border-t-[3px] border-[#F3C00D]/50 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)] card-hover">
  {/* Photo area */}
  <div class="relative aspect-[4/3] overflow-hidden bg-parchment">
    {
      image ? (
        <img
          src={image}
          alt={name}
          class="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <div class="flex h-full w-full items-center justify-center">
          <span class="font-[family-name:var(--font-display)] text-[3rem] text-[#F3C00D]/20">
            {name.charAt(0)}
          </span>
        </div>
      )
    }
  </div>

  {/* Details */}
  <div class="p-8">
    <h3 class="font-[family-name:var(--font-heading)] text-[1.05rem] font-normal text-charcoal">
      {name}
    </h3>
    <p class="mt-1 font-[family-name:var(--font-ui)] text-[11px] font-semibold uppercase tracking-[0.15em] text-gold-dark">
      {title}
    </p>
    <div class="mt-3 h-px w-8 bg-[#F3C00D]/30"></div>
    <p class="mt-4 font-[family-name:var(--font-body)] text-[13px] leading-[1.85] text-charcoal/60">
      {bio}
    </p>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/components/LeadershipCard.astro
git commit -m "feat: add LeadershipCard component for team sections"
```

---

### Task 10: ChannelSplit.astro

**Files:**
- Create: `src/components/ChannelSplit.astro`

**Step 1: Create component**

```astro
---
/**
 * ChannelSplit — B2B/B2C dual-column layout with distinct CTAs.
 * Used inside BotanicalSection for "How We Sell" pattern.
 */
interface Channel {
  eyebrow: string;
  heading: string;
  items: string[];
  cta: { label: string; url: string };
}

interface Props {
  b2b: Channel;
  b2c: Channel;
}

const { b2b, b2c } = Astro.props;
---

<div class="mx-auto grid max-w-5xl grid-cols-1 gap-6 px-6 md:grid-cols-2 lg:px-12">
  {/* B2B Column */}
  <div class="rounded-[2px] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-sm frosted-hover md:p-10">
    <p class="font-[family-name:var(--font-heading)] text-[9px] font-normal uppercase tracking-[0.3em] text-[#F3C00D]/60">
      {b2b.eyebrow}
    </p>
    <h3 class="mt-2 font-[family-name:var(--font-heading)] text-[1.15rem] font-normal tracking-wide text-white">
      {b2b.heading}
    </h3>
    <div class="mt-3 h-px w-8 bg-[#F3C00D]/20"></div>
    <ul class="mt-6 space-y-3">
      {
        b2b.items.map((item) => (
          <li class="flex items-start gap-3 font-[family-name:var(--font-body)] text-[13px] leading-relaxed text-white/55">
            <span class="mt-2 h-px w-4 shrink-0 bg-[#F3C00D]/40" />
            {item}
          </li>
        ))
      }
    </ul>
    <a
      href={b2b.cta.url}
      class="mt-8 inline-block rounded-[3px] border border-[#F3C00D]/30 px-6 py-3 font-[family-name:var(--font-ui)] text-[12px] font-semibold text-[#F3C00D]/80 transition-all duration-300 hover:border-[#F3C00D]/60 hover:bg-[#F3C00D]/10"
    >
      {b2b.cta.label}
    </a>
  </div>

  {/* B2C Column */}
  <div class="rounded-[2px] border border-white/10 bg-white/[0.06] p-8 backdrop-blur-sm frosted-hover md:p-10">
    <p class="font-[family-name:var(--font-heading)] text-[9px] font-normal uppercase tracking-[0.3em] text-[#F3C00D]/60">
      {b2c.eyebrow}
    </p>
    <h3 class="mt-2 font-[family-name:var(--font-heading)] text-[1.15rem] font-normal tracking-wide text-white">
      {b2c.heading}
    </h3>
    <div class="mt-3 h-px w-8 bg-[#F3C00D]/20"></div>
    <ul class="mt-6 space-y-3">
      {
        b2c.items.map((item) => (
          <li class="flex items-start gap-3 font-[family-name:var(--font-body)] text-[13px] leading-relaxed text-white/55">
            <span class="mt-2 h-px w-4 shrink-0 bg-[#F3C00D]/40" />
            {item}
          </li>
        ))
      }
    </ul>
    <a
      href={b2c.cta.url}
      class="mt-8 inline-block rounded-[3px] bg-leaf-green px-6 py-3 font-[family-name:var(--font-ui)] text-[12px] font-semibold text-white transition-all duration-300 hover:bg-grass-green hover:shadow-lg hover:shadow-leaf-green/25"
    >
      {b2c.cta.label}
    </a>
  </div>
</div>
```

**Step 2: Commit**

```bash
git add src/components/ChannelSplit.astro
git commit -m "feat: add ChannelSplit component for B2B/B2C layout"
```

---

## Phase 4: Preact Islands

### Task 11: CountUpIsland.tsx

**Files:**
- Create: `src/components/islands/CountUpIsland.tsx`

**Step 1: Create island**

```tsx
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

export default function CountUpIsland({
  target,
  label,
  prefix = "",
  suffix = "",
}: Props) {
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
```

**Step 2: Commit**

```bash
git add src/components/islands/CountUpIsland.tsx
git commit -m "feat: add CountUpIsland Preact island for animated counters"
```

---

### Task 12: ImpactBarIsland.tsx

**Files:**
- Create: `src/components/islands/ImpactBarIsland.tsx`

**Step 1: Create island**

```tsx
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

export default function ImpactBarIsland({
  stats,
  staggerMs = 200,
}: Props) {
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
    <div
      ref={ref}
      class="grid grid-cols-2 gap-8 py-4 md:grid-cols-4 md:gap-12"
    >
      {stats.map((stat, i) => (
        <Counter
          key={stat.label}
          {...stat}
          delay={i * staggerMs}
          trigger={trigger}
        />
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/islands/ImpactBarIsland.tsx
git commit -m "feat: add ImpactBarIsland Preact island for staggered counters"
```

---

### Task 13: AccordionIsland.tsx

**Files:**
- Create: `src/components/islands/AccordionIsland.tsx`

**Step 1: Create island**

```tsx
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
```

**Step 2: Commit**

```bash
git add src/components/islands/AccordionIsland.tsx
git commit -m "feat: add AccordionIsland Preact island with smooth animation"
```

---

### Task 14: TabSwitcherIsland.tsx

**Files:**
- Create: `src/components/islands/TabSwitcherIsland.tsx`

**Step 1: Create island**

```tsx
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

export default function TabSwitcherIsland({
  tabs,
  variant = "dark",
}: Props) {
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

      {/* Tab panel */}
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
```

**Step 2: Commit**

```bash
git add src/components/islands/TabSwitcherIsland.tsx
git commit -m "feat: add TabSwitcherIsland Preact island for tabbed content"
```

---

### Task 15: ScrollRevealIsland.tsx

**Files:**
- Create: `src/components/islands/ScrollRevealIsland.tsx`

**Step 1: Create island**

```tsx
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

const transforms = {
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
```

**Step 2: Commit**

```bash
git add src/components/islands/ScrollRevealIsland.tsx
git commit -m "feat: add ScrollRevealIsland Preact island for scroll animations"
```

---

## Phase 5: About Page Assembly

### Task 16: Rewrite about/index.astro

**Files:**
- Modify: `src/pages/about/index.astro` (full rewrite)

**Step 1: Rewrite the About page**

Replace the entire content of `src/pages/about/index.astro` with the new 20-section structure. This is the core integration task. The complete file is too large to inline here — implement section by section:

**Imports to add:**

```astro
import BotanicalSection from "../../components/BotanicalSection.astro";
import SplitEditorial from "../../components/SplitEditorial.astro";
import PullQuote from "../../components/PullQuote.astro";
import GlassCard from "../../components/GlassCard.astro";
import LeadershipCard from "../../components/LeadershipCard.astro";
import ChannelSplit from "../../components/ChannelSplit.astro";
import SloganBanner from "../../components/SloganBanner.astro";
import AccordionItem from "../../components/AccordionItem.astro";
import AccordionGroup from "../../components/AccordionGroup.astro";
import FeatureList from "../../components/FeatureList.astro";
import DualCTASection from "../../components/DualCTASection.astro";
import ImpactBarIsland from "../../components/islands/ImpactBarIsland.tsx";
```

**Data arrays to keep (existing):** `timeline`, `collections`, `values`, `impacts`

**Data to add:**

```typescript
const R2_ABOUT = "https://cdn.forestal-mt.com/pages/about";

const whoWeAreBullets = [
  "Artisanal and wild-harvested products rooted in indigenous knowledge",
  "Direct sourcing from native ecosystems and cultural territories",
  "Traditional processing that preserves botanical potency",
  "Ethical export with a clear chain of origin",
  "Diversified operations across exports, real estate, commerce, agriculture, and livestock",
];

const historyDeepDive = [
  {
    title: "Expansion into Ethnobotanicals",
    content: "<p>With renewed clarity of mission, Forestal MT expanded into <strong>three curated botanical collections</strong>, each rooted in Honduras&rsquo; ancestral heritage:</p><ul class='mt-3 space-y-2'><li><strong>Batana Oil</strong> &mdash; Wild-harvested <em>Elaeis oleifera</em> from La Mosquitia</li><li><strong>Stingless Bee Honey</strong> &mdash; Traditional Jimerito from native forests</li><li><strong>Traditional Herbs</strong> &mdash; Wildcrafted botanicals from cloud forests and coastal regions</li></ul><p class='mt-3'>These collections bridge indigenous territories, traditional harvesters, and biodiverse Honduran landscapes to global partners seeking authenticity and traceability.</p>",
  },
  {
    title: "Strategic Diversification",
    content: "<p>Alongside its core ethnobotanical and forestry operations, Forestal MT maintains <strong>complementary business activities</strong> that strengthen long-term resilience and regional impact:</p><ul class='mt-3 space-y-2'><li><strong>Real estate development</strong> &mdash; Strategic land management and property development</li><li><strong>Livestock operations</strong> &mdash; Sustainable ranching practices</li><li><strong>Strategic investments</strong> &mdash; Portfolio diversification for generational wealth</li><li><strong>Local commerce</strong> &mdash; Supporting regional economic development</li></ul>",
  },
  {
    title: "Present Day — Global Ambassador",
    content: "<p>What began as a single bottle of Batana Oil has grown into a <strong>multi-collection export enterprise</strong> serving partners across North America, Central and South America, Europe, and Asia.</p><p class='mt-3'>Through continued growth, Forestal MT preserves a transparent forest-to-customer chain and remains committed to safeguarding ancestral knowledge, ecological integrity, and sustainable rural livelihoods.</p>",
  },
];

const impactStats = [
  { target: 5000, label: "Hectares Stewarded", suffix: "+" },
  { target: 46, label: "Products" },
  { target: 4, label: "Continents Served" },
  { target: 6, label: "Years of Partnerships", suffix: "+" },
];

const leadership = [
  {
    name: "Nery Roberto Murillo M.",
    title: "Founder",
    bio: "Entered the lumber industry in the 1990s with a long-term vision. Founded Forestal MT in 2009. His philosophy of responsible land management became the foundation for the company's ethnobotanical mission.",
  },
  {
    name: "Nery Samuel Murillo",
    title: "General Manager",
    bio: "Strategic direction and international partnerships. Leading the company's digital expansion and global B2B/B2C growth across North America, Europe, and Asia.",
  },
  {
    name: "Operations & Finance",
    title: "Family Leadership",
    bio: "Quality control, sourcing, production oversight, compliance, accounting, and regulatory affairs. Three generations working together to maintain the commitment to quality and trust.",
  },
];
```

**New sections to add between existing ones (in order):**

After section 6 ("We Are The Source"), add:
1. **Impact Bar** — `BotanicalSection` with `ImpactBarIsland`
2. **PullQuote** — Founder quote

After Timeline (section 10), add:
3. **AccordionGroup** — History deep dive

After Collections (section 12), add:
4. **BotanicalSection + ChannelSplit** — How We Sell

After Values (section 14), add:
5. **Leadership section** — 3 LeadershipCards

After Logo (section 16), add:
6. **SloganBanner** — "Exporting Nature Without Borders"

Modify existing Community Impact to use `FeatureList` component.

Replace inline Partner CTA with `DualCTASection`.

Add PullQuote variant as "Our Commitment" before final CTA.

**Step 2: Build and verify**

Run: `pnpm build`
Expected: PASS with no errors

**Step 3: Visual verification**

Run: `pnpm dev`
Open: `http://localhost:4321/about/`
Verify: All 20 sections render, images load from R2, counters animate on scroll

**Step 4: Commit**

```bash
git add src/pages/about/index.astro
git commit -m "feat: complete About page with all MDX content and new components"
```

---

## Phase 6: Build Verification

### Task 17: Full build + format check

**Step 1: Format all new files**

Run: `pnpm format`

**Step 2: Lint check**

Run: `pnpm lint`
Fix any issues.

**Step 3: Full build**

Run: `pnpm build`
Expected: Clean build, no warnings about unused components.

**Step 4: Final commit + push**

```bash
git add -A
git commit -m "chore: format and lint new About page components"
git push
```

---

## Component Count Summary

| Category | Before | After |
|----------|--------|-------|
| Astro components | 14 | 25 (+11) |
| Preact islands | 2 | 7 (+5) |
| **Total** | **16** | **32** |

## About Page Section Count

| Category | Before | After |
|----------|--------|-------|
| Sections | 11 | 20 (+9) |
| R2 images used | 0 (only hero) | 5 botanical + hero |
| Missing MDX content | 4 sections | 0 |
