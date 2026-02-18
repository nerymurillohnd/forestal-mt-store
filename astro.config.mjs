// @ts-check
import { defineConfig, fontProviders, passthroughImageService } from "astro/config";
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
  }),

  image: {
    service: passthroughImageService(),
  },

  integrations: [
    preact(),
    sitemap(),
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
