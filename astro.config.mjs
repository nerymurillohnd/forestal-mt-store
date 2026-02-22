// @ts-check
import { readFileSync } from "node:fs";
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";
import icon from "astro-icon";

import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

// ── Sitemap image/video data — loaded at build time ──────────────────────────
const _mediaRaw = JSON.parse(
  readFileSync(new URL("./src/data/jsonld/products/media.json", import.meta.url), "utf-8"),
);

/** handler → [{url, caption, title}] for product image sitemap entries */
const _productImgMap = Object.fromEntries(
  _mediaRaw.products.map((p) => [
    `https://forestal-mt.com/products/${p.handler}/`,
    [{ url: p.image.url, caption: p.image.caption, title: p.image.alt }],
  ]),
);

/** Static image map for content pages (OG + hero where confirmed) */
const _pageImgMap = {
  "https://forestal-mt.com/": [
    {
      url: "https://cdn.forestal-mt.com/pages/home/og.jpg",
      title: "Forestal MT — Batana Oil, Honey & Wild Herbs from Honduras",
    },
  ],
  "https://forestal-mt.com/about/": [
    {
      url: "https://cdn.forestal-mt.com/pages/about/hero.jpg",
      title: "About Forestal MT — Family-Owned Honduran Exporter",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/about/og.jpg",
      title: "About Forestal MT",
    },
  ],
  "https://forestal-mt.com/batana-oil/": [
    {
      url: "https://cdn.forestal-mt.com/pages/batana-oil/og.jpg",
      title: "Batana Oil — The Miskito Secret for Hair & Skin",
    },
  ],
  "https://forestal-mt.com/stingless-bee-honey/": [
    {
      url: "https://cdn.forestal-mt.com/pages/stingless-bee-honey/og.jpg",
      title: "Jimerito Honey — Rare Stingless Bee Honey from Honduras",
    },
  ],
  "https://forestal-mt.com/traditional-herbs/": [
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/hero.jpg",
      title: "Traditional Herbs — 41 Wildcrafted Botanicals from Honduras",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/og.jpg",
      title: "Traditional Herbs — Honduras's Botanical Heritage",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/classification.jpg",
      caption: "Botanical classification of traditional herbs from Honduras",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/quassia.jpg",
      caption: "Quassia amara — Central American medicinal herb",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/bark-corteza.jpg",
      caption: "Bark (corteza) plant material — wildcrafted from Honduras",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/dandelion.jpg",
      caption: "Dandelion — Taraxacum officinale wildcrafted herb",
    },
    {
      url: "https://cdn.forestal-mt.com/pages/traditional-herbs/dr-sebi.jpg",
      caption: "Dr. Sebi approved herbs from Honduras",
    },
  ],
  "https://forestal-mt.com/wholesale/": [
    {
      url: "https://cdn.forestal-mt.com/pages/wholesale/og.jpg",
      title: "Wholesale & Private Label — Forestal MT",
    },
  ],
  "https://forestal-mt.com/contact/": [
    {
      url: "https://cdn.forestal-mt.com/pages/contact/og.jpg",
      title: "Contact Forestal MT",
    },
  ],
  "https://forestal-mt.com/community/": [
    {
      url: "https://cdn.forestal-mt.com/pages/community/og.jpg",
      title: "Community — Forestal MT",
    },
  ],
  "https://forestal-mt.com/products/": [
    {
      url: "https://cdn.forestal-mt.com/pages/home/og.jpg",
      title: "Shop All — Forestal MT Products",
    },
  ],
};

/** Video entries for the 4 hero video pages */
const _pageVideoMap = {
  "https://forestal-mt.com/": [
    {
      thumbnail_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/2baff6ee682afbfae617fd25ed2b0209/thumbnails/thumbnail.jpg",
      title: "Batana Oil, Honey & Herbs from Honduras",
      description:
        "Family-owned Honduran exporter of Batana Oil, Jimerito stingless bee honey, and wildcrafted traditional herbs. Sourced directly from indigenous communities.",
      content_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/2baff6ee682afbfae617fd25ed2b0209/downloads/default.mp4",
      player_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/2baff6ee682afbfae617fd25ed2b0209/iframe",
      duration: 23,
    },
  ],
  "https://forestal-mt.com/batana-oil/": [
    {
      thumbnail_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/709312413ff576260a7596e37d4d5c97/thumbnails/thumbnail.jpg",
      title: "Batana Oil | Ancestral Miskito Elixir",
      description:
        "Pure Batana Oil sourced directly from Miskito communities in La Mosquitia, Honduras. Centuries-old ancestral hair and skin restoration oil.",
      content_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/709312413ff576260a7596e37d4d5c97/downloads/default.mp4",
      player_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/709312413ff576260a7596e37d4d5c97/iframe",
      duration: 22,
    },
  ],
  "https://forestal-mt.com/stingless-bee-honey/": [
    {
      thumbnail_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/d26fac9cccc86e666b136d952c1ea413/thumbnails/thumbnail.jpg",
      title: "Stingless Bee Honey | The Maya Heritage",
      description:
        "Rare Jimerito honey from native Tetragonisca angustula bees in Honduran rainforests, prized by the Maya for centuries.",
      content_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/d26fac9cccc86e666b136d952c1ea413/downloads/default.mp4",
      player_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/d26fac9cccc86e666b136d952c1ea413/iframe",
      duration: 22,
    },
  ],
  "https://forestal-mt.com/traditional-herbs/": [
    {
      thumbnail_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/7dc57c8cc048bb7a7ac5e5f2aefb1eb0/thumbnails/thumbnail.jpg",
      title: "Traditional Herbs | Sacred Wisdom Rooted in Nature",
      description:
        "41 wildcrafted, shade-dried botanicals from Honduras — an apothecary of ethnobotanical wisdom preserved for millennia by indigenous cultures of Central America.",
      content_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/7dc57c8cc048bb7a7ac5e5f2aefb1eb0/downloads/default.mp4",
      player_loc:
        "https://customer-8w5s9dekjdinwesc.cloudflarestream.com/7dc57c8cc048bb7a7ac5e5f2aefb1eb0/iframe",
      duration: 20,
    },
  ],
};

// ── Site identity — single source of truth ─────────────────────────────────
// SITE_URL: canonical origin (https, non-www — www redirects via CF rule)
// DOMAIN:   bare hostname, no protocol. Used for cookies, CORS, GSC property.
//           Both www.forestal-mt.com and forestal-mt.com resolve to this domain.
const SITE_URL = "https://forestal-mt.com";
const DOMAIN = "forestal-mt.com";

// https://astro.build/config
export default defineConfig({
  site: SITE_URL,
  output: "static",
  trailingSlash: "always",

  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: "compile",
  }),

  integrations: [
    preact(),
    sitemap({
      // Rename — forces Google to read as new, cleans GSC history slate
      // Confirmed types in node_modules/@astrojs/sitemap/dist/index.d.ts
      filenameBase: "fmt-sitemap",

      // Exclude 404 + all future e-commerce/auth paths per SEO_STRUCTURED_DATA_SPEC.md §1
      // These pages don't exist yet but will be noindex when built — filter now prevents
      // any future build from accidentally adding them to the sitemap.
      filter: (page) =>
        !page.endsWith("/404/") &&
        !page.endsWith("/404") &&
        !page.includes("/cart/") &&
        !page.includes("/checkout/") &&
        !page.includes("/account/") &&
        !page.includes("/admin/") &&
        !page.includes("/login/") &&
        !page.includes("/register/") &&
        !page.includes("/forgot-password/") &&
        !page.includes("/reset-password/") &&
        !page.includes("/order-confirmation/") &&
        !page.includes("/order-tracking/"),

      // Add image:image and video:video entries per URL
      serialize: (item) => {
        const img = _pageImgMap[item.url] || _productImgMap[item.url] || undefined;
        const video = _pageVideoMap[item.url] || undefined;
        return { ...item, ...(img && { img }), ...(video && { video }) };
      },

      // Split by content type — crawl budget segmentation
      // products: fmt-sitemap-products-0.xml (47 URLs)
      // unmatched → "pages" chunk: fmt-sitemap-pages-0.xml (16 URLs)
      chunks: {
        products: (item) => {
          if (item.url.includes("/products/")) return item;
        },
      },

      // lastmod intentionally omitted:
      // No date fields in MDX frontmatter or content schema.
      // Google docs: fake/build-time lastmod reduces crawler trust over time.
      // Future: add lastmod to content schema when accurate dates are tracked.
    }),
    mdx(),
    icon(),
    sentry({
      project: "forestal-mt-store",
      org: "forestal-mt",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      bundleSizeOptimizations: {
        excludeDebugStatements: true,
        excludeReplayIframe: true,
        excludeReplayShadowDom: true,
        excludeReplayWorker: true,
      },
    }),
    spotlightjs(),
  ],

  vite: {
    plugins: [tailwindcss()],
    build: {
      // Target modern browsers — avoids injecting polyfills for features
      // already in Baseline (e.g. Array.from), reducing JS payload.
      target: "es2020",
    },
    define: {
      // Expose site identity constants to all modules via import.meta.env.
      // Typed in src/env.d.ts. Replace hardcoded strings in image.ts / jsonld-shared.ts.
      "import.meta.env.SITE_URL": JSON.stringify(SITE_URL),
      "import.meta.env.DOMAIN": JSON.stringify(DOMAIN),
    },
  },

  experimental: {
    fonts: [
      {
        provider: fontProviders.local(),
        name: "The New Elegance",
        cssVariable: "--font-display",
        fallbacks: ["serif"],
        options: {
          variants: [
            {
              weight: 400,
              style: "normal",
              src: ["./src/assets/fonts/the-new-elegance/TheNewEleganceRegular/font.woff2"],
            },
            {
              weight: 400,
              style: "italic",
              src: ["./src/assets/fonts/the-new-elegance/TheNewEleganceCondensedItalic/font.woff2"],
            },
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Cinzel",
        cssVariable: "--font-heading",
        fallbacks: ["serif"],
        options: {
          variants: [
            {
              weight: 400,
              style: "normal",
              src: ["./src/assets/fonts/cinzel/cinzel-400.woff2"],
            },
            {
              weight: 600,
              style: "normal",
              src: ["./src/assets/fonts/cinzel/cinzel-600.woff2"],
            },
            {
              weight: 700,
              style: "normal",
              src: ["./src/assets/fonts/cinzel/cinzel-700.woff2"],
            },
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Libre Baskerville",
        cssVariable: "--font-body",
        fallbacks: ["Georgia", "serif"],
        options: {
          variants: [
            {
              weight: 400,
              style: "normal",
              src: ["./src/assets/fonts/libre-baskerville/libre-baskerville-400-normal.woff2"],
            },
            {
              weight: 400,
              style: "italic",
              src: ["./src/assets/fonts/libre-baskerville/libre-baskerville-400-italic.woff2"],
            },
            {
              weight: 700,
              style: "normal",
              src: ["./src/assets/fonts/libre-baskerville/libre-baskerville-700-normal.woff2"],
            },
          ],
        },
      },
      {
        provider: fontProviders.local(),
        name: "Open Sans",
        cssVariable: "--font-ui",
        fallbacks: ["system-ui", "sans-serif"],
        options: {
          variants: [
            {
              weight: 300,
              style: "normal",
              src: ["./src/assets/fonts/open-sans/open-sans-300-normal.woff2"],
            },
            {
              weight: 400,
              style: "normal",
              src: ["./src/assets/fonts/open-sans/open-sans-400-normal.woff2"],
            },
            {
              weight: 400,
              style: "italic",
              src: ["./src/assets/fonts/open-sans/open-sans-400-italic.woff2"],
            },
            {
              weight: 600,
              style: "normal",
              src: ["./src/assets/fonts/open-sans/open-sans-600-normal.woff2"],
            },
            {
              weight: 700,
              style: "normal",
              src: ["./src/assets/fonts/open-sans/open-sans-700-normal.woff2"],
            },
          ],
        },
      },
    ],
  },
});
