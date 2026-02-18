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
  pageData: { pageName: string; canonicalUrl: string },
): unknown | null {
  const { type, id, mode } = ref;

  switch (type) {
    case "Organization":
      return mode === "compact" ? OrganizationCompact : OrganizationFull;

    case "Brand":
      return mode === "compact" ? BrandCompact : BrandFull;

    case "WebSite":
      return WebSiteFull;

    case "SearchAction":
      // SearchAction is embedded inside WebSite, not a standalone node
      return null;

    case "VideoObject":
      return videoObjects[id] ?? null;

    case "BreadcrumbList":
      return buildBreadcrumb(pageData.pageName, pageData.canonicalUrl);

    case "ImageObject":
      // OG images and hero images — generated inline per page
      return null;

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

    case "OfferCatalog":
      // Catalog pages — minimal stub, full catalog is post-MVP
      return null;

    case "Service":
      return ServiceWholesale;

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
  pageData: { pageName: string; canonicalUrl: string },
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
