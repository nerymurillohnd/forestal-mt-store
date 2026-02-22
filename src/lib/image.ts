/**
 * Cloudflare Image Resizing helpers.
 *
 * Transforms images on-the-fly via /cdn-cgi/image/ — no local processing.
 * Works with any image served through a Cloudflare-proxied domain.
 *
 * Usage in .astro:
 *   import { cdnImage, cdnSrcSet } from "../lib/image";
 *   <img src={cdnImage("https://cdn.forestal-mt.com/pages/about/hero.jpg", { w: 800, f: "webp" })} />
 *   <img srcset={cdnSrcSet("https://cdn.forestal-mt.com/pages/about/hero.jpg", [400, 800, 1200])} />
 *
 * Usage in <picture> for avif + webp + fallback:
 *   <picture>
 *     <source srcset={cdnSrcSet(url, [400, 800, 1200], "avif")} type="image/avif" />
 *     <source srcset={cdnSrcSet(url, [400, 800, 1200], "webp")} type="image/webp" />
 *     <img src={cdnImage(url, { w: 800 })} />
 *   </picture>
 */

export function sanitizeOrigin(rawSiteUrl: string | undefined): string {
  if (!rawSiteUrl) {
    throw new Error("SITE_URL is required");
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawSiteUrl);
  } catch {
    throw new Error("SITE_URL must be a valid URL");
  }

  return parsedUrl.origin;
}

const TRANSFORM_ORIGIN = sanitizeOrigin(import.meta.env.SITE_URL);

type ImageFormat = "webp" | "avif" | "auto" | "json";
type Fit = "scale-down" | "contain" | "cover" | "crop" | "pad";
type Gravity = "auto" | "left" | "right" | "top" | "bottom" | "center";

interface ImageOptions {
  /** Width in pixels */
  w?: number;
  /** Height in pixels */
  h?: number;
  /** Output format — "auto" lets Cloudflare pick best for client */
  f?: ImageFormat;
  /** Fit mode */
  fit?: Fit;
  /** Quality 1-100 */
  q?: number;
  /** Gravity for crop */
  gravity?: Gravity;
  /** Device pixel ratio (1, 2, 3) */
  dpr?: number;
}

function buildParams(opts: ImageOptions): string {
  const parts: string[] = [];
  if (opts.w) parts.push(`width=${opts.w}`);
  if (opts.h) parts.push(`height=${opts.h}`);
  if (opts.f) parts.push(`format=${opts.f}`);
  if (opts.fit) parts.push(`fit=${opts.fit}`);
  if (opts.q) parts.push(`quality=${opts.q}`);
  if (opts.gravity) parts.push(`gravity=${opts.gravity}`);
  if (opts.dpr) parts.push(`dpr=${opts.dpr}`);
  return parts.join(",");
}

/**
 * Generate a Cloudflare Image Resizing URL.
 * Default: format=auto (Cloudflare picks webp/avif based on Accept header).
 * Guard: if the URL already contains /cdn-cgi/image/, return it unchanged to prevent double-wrapping.
 */
export function cdnImage(imageUrl: string, opts: ImageOptions = {}): string {
  if (imageUrl.includes("/cdn-cgi/image/")) return imageUrl;
  const params = buildParams({ f: "auto", ...opts });
  return `${TRANSFORM_ORIGIN}/cdn-cgi/image/${params}/${imageUrl}`;
}

/**
 * Generate a srcset string for responsive images.
 * Each width produces a `{url} {w}w` entry.
 */
export function cdnSrcSet(
  imageUrl: string,
  widths: number[],
  format: ImageFormat = "auto",
): string {
  return widths.map((w) => `${cdnImage(imageUrl, { w, f: format })} ${w}w`).join(", ");
}
