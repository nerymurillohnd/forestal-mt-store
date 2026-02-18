/**
 * Cloudflare Stream video UIDs and metadata.
 * Customer subdomain: customer-8w5s9dekjdinwesc.cloudflarestream.com
 *
 * Usage in components:
 *   import { streamVideos, getStreamUrl } from "../data/stream-videos";
 *   <iframe src={getStreamUrl(streamVideos.home.uid)} allow="autoplay" />
 */

export const STREAM_CUSTOMER_SUBDOMAIN =
  "customer-8w5s9dekjdinwesc.cloudflarestream.com";

export const streamVideos = {
  home: {
    uid: "2baff6ee682afbfae617fd25ed2b0209",
    title: "Forestal MT | Exporting Nature Without Borders",
    duration: 22.9,
  },
  batanaOil: {
    uid: "709312413ff576260a7596e37d4d5c97",
    title: "Batana Oil | Ancestral Miskito Elixir",
    duration: 21.7,
  },
  stinglessBeeHoney: {
    uid: "d26fac9cccc86e666b136d952c1ea413",
    title: "Stingless Bee Honey | The Maya Heritage",
    duration: 21.8,
  },
  traditionalHerbs: {
    uid: "7dc57c8cc048bb7a7ac5e5f2aefb1eb0",
    title: "Traditional Herbs | Sacred Wisdom Rooted in Nature",
    duration: 20.0,
  },
} as const;

export function getStreamUrl(uid: string): string {
  return `https://${STREAM_CUSTOMER_SUBDOMAIN}/${uid}/iframe`;
}

export function getStreamHls(uid: string): string {
  return `https://${STREAM_CUSTOMER_SUBDOMAIN}/${uid}/manifest/video.m3u8`;
}

export function getStreamThumbnail(uid: string): string {
  return `https://${STREAM_CUSTOMER_SUBDOMAIN}/${uid}/thumbnails/thumbnail.jpg`;
}
