/**
 * JSON-LD @graph builder utility.
 *
 * Reads static schema files from src/data/jsonld/ and assembles
 * the @graph array for injection into page <head>.
 */

import OrganizationFull from "../data/jsonld/Organization.json";
import BrandFull from "../data/jsonld/Brand.json";
import WebSiteFull from "../data/jsonld/WebSite.json";
import VideoObjectHomeHero from "../data/jsonld/VideoObject-home-hero.json";
import VideoObjectBatanaOilHero from "../data/jsonld/VideoObject-batana-oil-hero.json";
import VideoObjectStinglessBeeHoneyHero from "../data/jsonld/VideoObject-stingless-bee-honey-hero.json";
import VideoObjectTraditionalHerbsHero from "../data/jsonld/VideoObject-traditional-herbs-hero.json";
import ServiceWholesale from "../data/jsonld/Service-wholesale.json";
import OnlineStoreFull from "../data/jsonld/OnlineStore.json";

const SITE_URL = "https://forestal-mt.com";

/** Compact Organization stub for non-home pages */
const OrganizationCompact = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Forestal MT",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/android-chrome-512x512.png`,
  },
};

/** Compact Brand stub for non-home pages */
const BrandCompact = {
  "@type": "Brand",
  "@id": `${SITE_URL}/#brand`,
  name: "Forestal MT",
  url: SITE_URL,
};

/** VideoObject lookup by hero id fragment */
const videoObjects: Record<string, unknown> = {
  [`${SITE_URL}/#hero-video`]: VideoObjectHomeHero,
  [`${SITE_URL}/batana-oil/#hero-video`]: VideoObjectBatanaOilHero,
  [`${SITE_URL}/stingless-bee-honey/#hero-video`]:
    VideoObjectStinglessBeeHoneyHero,
  [`${SITE_URL}/traditional-herbs/#hero-video`]:
    VideoObjectTraditionalHerbsHero,
};

interface SchemaRef {
  type: string;
  id: string;
  mode?: string;
}

/**
 * Build a BreadcrumbList schema for a page.
 */
function buildBreadcrumb(
  pageName: string,
  canonicalUrl: string,
): Record<string, unknown> {
  const items: Record<string, unknown>[] = [
    {
      "@type": "ListItem",
      position: 1,
      name: "Home",
      item: SITE_URL + "/",
    },
  ];

  // Last item has no "item" URL per Google guidelines
  items.push({
    "@type": "ListItem",
    position: 2,
    name: pageName,
  });

  return {
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: items,
  };
}

/**
 * Resolve a single schema reference to its JSON-LD node.
 */
function resolveSchema(
  ref: SchemaRef,
  pageData: {
    pageName: string;
    canonicalUrl: string;
    ogImage?: { url: string; alt: string; width: number; height: number };
  },
): unknown | null {
  const { type, id, mode } = ref;

  switch (type) {
    case "Organization":
      return mode === "compact" ? OrganizationCompact : OrganizationFull;

    case "Brand":
      return mode === "compact" ? BrandCompact : BrandFull;

    case "WebSite":
      return WebSiteFull;

    case "SearchAction": {
      // Already embedded in WebSite.potentialAction — extract with @id for graph reference
      const ws = WebSiteFull as Record<string, unknown>;
      const pa = ws.potentialAction as Record<string, unknown> | undefined;
      if (!pa) return null;
      return { ...pa, "@id": id };
    }

    case "VideoObject":
      return videoObjects[id] ?? null;

    case "BreadcrumbList":
      return buildBreadcrumb(pageData.pageName, pageData.canonicalUrl);

    case "ImageObject": {
      if (!pageData.ogImage) return null;
      return {
        "@type": "ImageObject",
        "@id": id,
        url: pageData.ogImage.url,
        contentUrl: pageData.ogImage.url,
        caption: pageData.ogImage.alt,
        width: pageData.ogImage.width,
        height: pageData.ogImage.height,
      };
    }

    case "AboutPage":
    case "ContactPage":
    case "WebPage": {
      return {
        "@type": type,
        "@id": id,
        name: pageData.pageName,
        url: pageData.canonicalUrl,
        isPartOf: { "@id": `${SITE_URL}/#website` },
        about: { "@id": `${SITE_URL}/#organization` },
      };
    }

    case "OfferCatalog": {
      // Extract sub-catalog from OnlineStore.hasOfferCatalog.itemListElement by @id
      const store = OnlineStoreFull as Record<string, unknown>;
      const catalog = store.hasOfferCatalog as Record<string, unknown> | undefined;
      if (!catalog) return null;
      const items = catalog.itemListElement as Record<string, unknown>[] | undefined;
      if (!items) return null;
      return items.find((item) => item["@id"] === id) ?? null;
    }

    case "Service": {
      if (!Array.isArray(ServiceWholesale)) return null;
      const match = (ServiceWholesale as Record<string, unknown>[]).find(
        (s) => s["@id"] === id,
      );
      return match ?? null;
    }

    default:
      return null;
  }
}

/**
 * Strip @context from a node — it belongs on the root wrapper only.
 */
function stripContext(node: Record<string, unknown>): Record<string, unknown> {
  const { "@context": _, ...rest } = node;
  return rest;
}

/**
 * Build the complete @graph for a page from its frontmatter schemas[].
 */
export function buildPageGraph(
  schemas: SchemaRef[],
  pageData: {
    pageName: string;
    canonicalUrl: string;
    ogImage?: { url: string; alt: string; width: number; height: number };
  },
): string {
  const graph: unknown[] = [];

  for (const ref of schemas) {
    const node = resolveSchema(ref, pageData);
    if (node === null) continue;

    // Service-wholesale returns an array of 4 Service nodes
    if (Array.isArray(node)) {
      graph.push(
        ...node.map((n) => stripContext(n as Record<string, unknown>)),
      );
    } else {
      graph.push(stripContext(node as Record<string, unknown>));
    }
  }

  if (graph.length === 0) return "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": graph,
  };

  return JSON.stringify(jsonLd);
}
