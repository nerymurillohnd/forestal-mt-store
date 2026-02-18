# Footer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current minimal Footer.astro with a production-ready e-commerce footer — dark botanical aesthetic, 5-column desktop grid, mobile-responsive, payment pills, social icons, tagline divider, and back-to-top button.

**Architecture:** Single component replacement (`src/components/Footer.astro`). No new CSS needed — all utility classes (`surface-dark`, `grain`, `gold-rule`, `link-draw`) are already defined in `global.css`. No Preact island needed — back-to-top uses an inline `<script>` tag.

**Tech Stack:** Astro 5.7, Tailwind CSS 4 (`@tailwindcss/vite`), Astro `Image` component, inline SVG icons, inline `<script>` for back-to-top.

**Design Reference:** `docs/plans/2026-02-18-footer-design.md`

---

## Task 1: Data Layer + Logo Import

**Files:**

- Modify: `src/components/Footer.astro` (frontmatter section only)

**Step 1: Replace the entire frontmatter block**

Open `src/components/Footer.astro`. Replace everything between the `---` fences with the following:

```astro
---
import { Image } from "astro:assets";
import logoLight from "../assets/logos/logo-light.png";

const year = new Date().getFullYear();

const quickLinks = [
  { label: "About Us", href: "/about/" },
  { label: "Wholesale", href: "/wholesale/" },
  { label: "Shop", href: "/" }, // placeholder — future /products/
  { label: "Contact", href: "/contact/" },
];

const exploreLinks = [
  { label: "Batana Oil", href: "/batana-oil/" },
  { label: "Jimerito Honey", href: "/stingless-bee-honey/" },
  { label: "Wild Herbs", href: "/traditional-herbs/" },
  { label: "FAQs", href: "/" }, // placeholder — future /community/faqs/
];

const policyLinks = [
  { label: "Terms & Conditions", href: "/terms/" },
  { label: "Privacy Policy", href: "/privacy/" },
  { label: "Shipping & Returns", href: "/shipping/" },
  { label: "Documents", href: "/" }, // placeholder
];

const socialLinks = [
  {
    label: "Facebook",
    href: "#",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/></svg>`,
  },
  {
    label: "Instagram",
    href: "#",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path fill-rule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clip-rule="evenodd"/></svg>`,
  },
  {
    label: "TikTok",
    href: "#",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.93a8.22 8.22 0 004.82 1.55V7.04a4.85 4.85 0 01-1.05-.35z"/></svg>`,
  },
  {
    label: "LinkedIn",
    href: "#",
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="h-5 w-5" aria-hidden="true"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>`,
  },
];
---
```

**Step 2: Verify the frontmatter compiles**

Run: `pnpm check`
Expected: No type errors. If there are import path errors, verify `logo-light.png` exists at `src/assets/logos/logo-light.png`.

---

## Task 2: Main Grid — 5-Column Structure

**Files:**

- Modify: `src/components/Footer.astro` (template section)

**Step 1: Replace the entire HTML template**

Delete everything from `<footer` to the end of the file. Replace with:

```astro
<footer class="surface-dark grain relative" role="contentinfo">
  <div class="mx-auto max-w-7xl px-4 py-16 lg:px-8">
    <!-- 5-column grid: Logo (2fr) + 4 link columns (1fr each) -->
    <div
      class="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr] lg:gap-12"
    >
      <!-- Col 1: Logo (wide) -->
      <div class="flex items-start sm:col-span-2 lg:col-span-1">
        <a href="/" aria-label="Forestal MT — Home">
          <Image src={logoLight} alt="Forestal MT" width={160} class="h-auto w-40" />
        </a>
      </div>

      <!-- Col 2: Quick Links -->
      <div>
        <h3
          class="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-widest text-gold"
        >
          Quick Links
        </h3>
        <ul class="mt-4 space-y-3">
          {
            quickLinks.map((link) => (
              <li>
                <a
                  href={link.href}
                  class="link-draw font-[family-name:var(--font-ui)] text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))
          }
        </ul>
      </div>

      <!-- Col 3: Explore -->
      <div>
        <h3
          class="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-widest text-gold"
        >
          Explore
        </h3>
        <ul class="mt-4 space-y-3">
          {
            exploreLinks.map((link) => (
              <li>
                <a
                  href={link.href}
                  class="link-draw font-[family-name:var(--font-ui)] text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))
          }
        </ul>
      </div>

      <!-- Col 4: Docs & Policies -->
      <div>
        <h3
          class="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-widest text-gold"
        >
          Docs & Policies
        </h3>
        <ul class="mt-4 space-y-3">
          {
            policyLinks.map((link) => (
              <li>
                <a
                  href={link.href}
                  class="link-draw font-[family-name:var(--font-ui)] text-sm text-white/60 transition-colors hover:text-white"
                >
                  {link.label}
                </a>
              </li>
            ))
          }
        </ul>
      </div>

      <!-- Col 5: Follow Us -->
      <div>
        <h3
          class="font-[family-name:var(--font-heading)] text-xs font-semibold uppercase tracking-widest text-gold"
        >
          Follow Us
        </h3>
        <div class="mt-4 grid grid-cols-2 gap-3">
          {
            socialLinks.map((social) => (
              <a
                href={social.href}
                aria-label={social.label}
                class="flex items-center gap-2 text-white/60 transition-colors hover:text-white"
              >
                <Fragment set:html={social.icon} />
                <span class="font-[family-name:var(--font-ui)] text-xs">{social.label}</span>
              </a>
            ))
          }
        </div>
      </div>
    </div>
    <!-- END grid -->
  </div>
</footer>
```

**Step 2: Build to verify no errors**

Run: `pnpm build`
Expected: Build completes without errors. If Image import fails, check that `@astrojs/images` is configured (it's included in Astro 5 core — no extra package needed).

---

## Task 3: Tagline Divider

**Files:**

- Modify: `src/components/Footer.astro` — add inside `<div class="mx-auto...">` after the grid `</div>`

**Step 1: Add the tagline section**

After the closing `</div>` of the 5-column grid, and before the closing `</div>` of `mx-auto max-w-7xl`, insert:

```astro
<!-- Tagline divider -->
<div class="flex items-center gap-6 py-10">
  <div
    class="h-px flex-1"
    style="background: linear-gradient(90deg, transparent, rgba(161,133,0,0.5), transparent);"
    aria-hidden="true"
  >
  </div>
  <p
    class="shrink-0 font-[family-name:var(--font-display)] text-lg italic text-white/75 sm:text-xl"
  >
    Exporting Nature Without Borders
  </p>
  <div
    class="h-px flex-1"
    style="background: linear-gradient(90deg, transparent, rgba(161,133,0,0.5), transparent);"
    aria-hidden="true"
  >
  </div>
</div>
```

**Note:** Using inline `style` for the gradient because `.gold-rule` in global.css has a fixed `max-width: 4rem` and `margin: auto` — it doesn't expand to fill available space. The inline gradient matches the same gold-dark color token (`#A18500` → `rgba(161,133,0)`).

**Step 2: Build and verify**

Run: `pnpm build`
Expected: Clean build.

---

## Task 4: Bottom Bar

**Files:**

- Modify: `src/components/Footer.astro` — add after the tagline divider, still inside `mx-auto max-w-7xl`

**Step 1: Add the bottom bar**

After the tagline divider `</div>`, insert before the closing `</div>` of the main container:

```astro
<!-- Bottom bar -->
<div
  class="flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:flex-row sm:justify-between"
>
  <!-- Left: Payment pills -->
  <div class="flex flex-wrap items-center gap-2" aria-label="Accepted payment methods">
    <!-- Visa -->
    <span
      class="inline-flex items-center rounded-sm bg-[#1434CB] px-2 py-0.5 text-[10px] font-bold text-white"
    >
      VISA
    </span>
    <!-- Mastercard -->
    <span
      class="inline-flex items-center rounded-sm bg-[#EB001B] px-2 py-0.5 text-[10px] font-bold text-white"
    >
      MC
    </span>
    <!-- Moneygram -->
    <span
      class="inline-flex items-center rounded-sm bg-[#EE3124] px-2 py-0.5 text-[10px] font-bold text-white"
    >
      Moneygram
    </span>
    <!-- Western Union -->
    <span
      class="inline-flex items-center rounded-sm bg-[#FFD700] px-2 py-0.5 text-[10px] font-bold text-black"
    >
      WU
    </span>
    <!-- Banco Atlántida -->
    <span
      class="inline-flex items-center rounded-sm bg-[#004A97] px-2 py-0.5 text-[10px] font-bold text-white"
    >
      Atlántida
    </span>
  </div>

  <!-- Center: Copyright -->
  <p class="font-[family-name:var(--font-ui)] text-xs text-white/40">
    &copy; {year} Forestal Murillo Tejada S. de R.L. | All rights reserved.
  </p>

  <!-- Right: Location -->
  <p class="font-[family-name:var(--font-ui)] text-xs text-white/40">Olancho, Honduras</p>
</div>
```

**Step 2: Build and verify**

Run: `pnpm build`
Expected: Clean build. The year should render as `2026`.

---

## Task 5: Back-to-Top Button

**Files:**

- Modify: `src/components/Footer.astro` — add after the closing `</footer>` tag

**Step 1: Add the floating button + script**

After `</footer>`, append:

```astro
<!-- Back to top button -->
<button
  id="back-to-top"
  type="button"
  aria-label="Back to top"
  class="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-gold text-charcoal opacity-0 shadow-lg transition-all duration-300 hover:bg-gold-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
  style="pointer-events: none;"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2.5"
    stroke-linecap="round"
    stroke-linejoin="round"
    class="h-5 w-5"
    aria-hidden="true"
  >
    <path d="M18 15l-6-6-6 6"></path>
  </svg>
</button>

<script>
  (function () {
    const btn = document.getElementById("back-to-top");
    if (!btn) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function updateVisibility() {
      const visible = window.scrollY > 300;
      btn.style.opacity = visible ? "1" : "0";
      btn.style.pointerEvents = visible ? "auto" : "none";
    }

    window.addEventListener("scroll", updateVisibility, { passive: true });

    btn.addEventListener("click", () => {
      window.scrollTo({
        top: 0,
        behavior: prefersReducedMotion ? "instant" : "smooth",
      });
    });
  })();
</script>
```

**Step 2: Build and verify**

Run: `pnpm build`
Expected: Clean build, no errors.

---

## Task 6: Mobile Touch Targets

**Files:**

- Modify: `src/components/Footer.astro` — add `min-h-[44px]` to link items on mobile

**Step 1: Update each link `<a>` in the 4 link columns**

In the Quick Links, Explore, and Docs & Policies columns, the `<a>` elements should include `min-h-[44px] flex items-center` for proper touch targets on mobile:

Change every link `<a class="link-draw font-... text-sm text-white/60 transition-colors hover:text-white">` to:

```astro
<a
  href={link.href}
  class="link-draw flex min-h-[44px] items-center font-[family-name:var(--font-ui)] text-sm text-white/60 transition-colors hover:text-white lg:min-h-0"
></a>
```

The `lg:min-h-0` resets the touch-target height on desktop (where hover is available and precise clicks are standard).

Apply the same to social link `<a>` elements in Follow Us:

```astro
<a
  href={social.href}
  aria-label={social.label}
  class="flex min-h-[44px] items-center gap-2 text-white/60 transition-colors hover:text-white lg:min-h-0"
></a>
```

**Step 2: Final build**

Run: `pnpm build`
Expected: Clean build. No warnings about images or missing assets.

---

## Task 7: Commit

**Step 1: Verify build passes one final time**

Run: `pnpm build`
Expected: `dist/` generated, zero errors.

**Step 2: Stage and commit**

```bash
git add src/components/Footer.astro
git commit -m "feat: implement final e-commerce footer with dark botanical aesthetic

- Dark surface-dark + grain background (charcoal + warm amber radial + noise)
- 5-column desktop grid: logo (2fr) + Quick Links + Explore + Docs & Policies + Follow Us
- Social icons: Facebook, Instagram, TikTok, LinkedIn (inline SVG)
- Tagline divider: Exporting Nature Without Borders with gold gradient rules
- Bottom bar: payment pills (Visa, MC, Moneygram, WU, Atlántida) + copyright + location
- Back-to-top button: fixed bottom-right, gold, visible after 300px scroll
- Mobile: 2-column link grid, stacked bottom bar, 44px touch targets
- Respects prefers-reduced-motion for scroll behavior

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

---

## Verification Checklist

After the commit, manually check these in `pnpm preview` or the browser:

- [ ] Footer background is dark (charcoal), not white/seasalt
- [ ] `logo-light.png` renders — not broken image
- [ ] 5 columns visible on desktop (lg+)
- [ ] 2-column grid on tablet (sm)
- [ ] Stacked single column on mobile (xs)
- [ ] Gold headings (Quick Links, Explore, etc.)
- [ ] Links are white/60 → white on hover with underline animation
- [ ] 4 social icons with labels in 2×2 grid
- [ ] "Exporting Nature Without Borders" tagline visible with flanking rules
- [ ] 5 payment pills visible in bottom bar left
- [ ] Copyright text centered (mobile: stacked below pills)
- [ ] "Olancho, Honduras" bottom-right (mobile: stacked)
- [ ] Back-to-top button hidden on load, appears after scrolling
- [ ] Back-to-top smooth-scrolls to top on click
- [ ] All links are clickable (min 44px tall on mobile)

---

## Known Limitations

- Social `href="#"` — replace with real URLs when social accounts are confirmed
- Shop, FAQs, Documents link to `/` — update when those pages are built
- `logo-light.png` exact dimensions unknown — `h-auto w-40` handles aspect ratio automatically
- Payment pills are text-based (not official SVG logos) — intentional for simplicity and licensing
