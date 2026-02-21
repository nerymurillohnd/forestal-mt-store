/// <reference types="astro/client" />

interface ImportMetaEnv {
  /**
   * Canonical site origin — "https://forestal-mt.com"
   * Injected at build time via vite.define in astro.config.mjs.
   * www.forestal-mt.com redirects to this via Cloudflare.
   */
  readonly SITE_URL: string;

  /**
   * Bare domain without protocol or www — "forestal-mt.com"
   * Matches the Google Search Console Domain property.
   * Use for: cookies, CORS origin matching, Sentry tracePropagationTargets.
   */
  readonly DOMAIN: string;
}
