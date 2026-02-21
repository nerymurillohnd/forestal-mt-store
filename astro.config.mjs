// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import preact from "@astrojs/preact";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

import mdx from "@astrojs/mdx";
import icon from "astro-icon";

import sentry from "@sentry/astro";
import spotlightjs from "@spotlightjs/astro";

// https://astro.build/config
export default defineConfig({
  site: "https://forestal-mt.com",
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
    }),
    spotlightjs(),
  ],

  vite: {
    plugins: [tailwindcss()],
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
