/**
 * JSON-LD builder for Product Detail Pages (PDPs) and Shop page.
 *
 * Produces a spec-compliant @graph with:
 *   ProductGroup → hasVariant[] → Product + Offer
 *   OfferShippingDetails x9, MerchantReturnPolicy,
 *   BreadcrumbList, HowTo, ImageObject, Organization, Brand
 *
 * This module is SSG-only — reads from static JSON files at build time.
 */

import OfferShippingDetailsRaw from "../data/jsonld/OfferShippingDetails.json";
import OrganizationFull from "../data/jsonld/Organization.json";
import OnlineStoreFull from "../data/jsonld/OnlineStore.json";

import { SITE_URL, OrganizationCompact, BrandCompact, OnlineStoreCompact } from "./jsonld-shared";

// ─── Shipping details (strip @context for graph embedding) ──────────────────

const shippingNodes = (OfferShippingDetailsRaw as Record<string, unknown>[]).map(
  ({ "@context": _, ...rest }) => rest,
);

const shippingIdRefs = shippingNodes.map((n) => ({ "@id": n["@id"] as string }));

// ─── Return policy (extracted from Organization.json) ───────────────────────

// Derive applicableCountry from shipping nodes — all unique ISO 3166-1 alpha-2 codes.
// Keeps return policy coverage in sync with shipping coverage automatically.
const shippingCountries: string[] = [
  ...new Set(
    shippingNodes.flatMap((n) => {
      const dest = (n as Record<string, unknown>).shippingDestination;
      const regions = Array.isArray(dest) ? dest : [dest];
      return (regions as Record<string, unknown>[])
        .map((r) => r.addressCountry as string)
        .filter((c) => typeof c === "string" && c.length === 2);
    }),
  ),
].sort();

const returnPolicyNode = (() => {
  const org = OrganizationFull as Record<string, unknown>;
  if (!org.hasMerchantReturnPolicy) {
    throw new Error(
      "Organization.json missing hasMerchantReturnPolicy — structure may have changed to @graph format",
    );
  }
  const rp = org.hasMerchantReturnPolicy as Record<string, unknown>;
  const { "@context": _, ...rest } = rp;
  return { ...rest, applicableCountry: shippingCountries } as Record<string, unknown>;
})();

const returnPolicyRef = { "@id": returnPolicyNode["@id"] as string };

// ─── Types for product data ─────────────────────────────────────────────────

export interface ProductData {
  handler: string;
  productGroupId: string;
  name: string;
  catalog: string;
  botanicalName?: string;
  url: string;
}

export interface ContentData {
  category: string;
  shortDescription: string;
  howToUse?: string[];
  material?: string;
  tags?: string[];
  qualityBadge?: string;
  audience?: {
    suggestedGender?: string;
    suggestedMinAge?: number;
  };
}

export interface MediaData {
  image: {
    url: string;
    alt: string;
    caption: string;
    width: number;
    height: number;
    encodingFormat: string;
  };
  variantImages: Array<{
    sku: string;
    url: string;
    alt: string;
  }>;
}

export interface SeoData {
  seoTitle: string;
  seoDescription: string;
  ogImageUrl: string;
  ogImageAlt: string;
  ogImageWidth: number;
  ogImageHeight: number;
}

export interface PricingVariant {
  sku: string;
  skuName: string;
  price: number;
  currency: string;
}

export interface ProductVariantData {
  sku: string;
  size: string;
  availability: string; // "InStock" | "OutOfStock"
  weightKg?: number; // physical mass from products.json
}

// ─── Catalog URL mapping ────────────────────────────────────────────────────

const catalogUrls: Record<string, string> = {
  "Batana Oil": `${SITE_URL}/batana-oil/`,
  "Stingless Bee Honey": `${SITE_URL}/stingless-bee-honey/`,
  "Traditional Herbs": `${SITE_URL}/traditional-herbs/`,
};

// ─── PDP @graph builder ─────────────────────────────────────────────────────

export function buildProductPageGraph(opts: {
  product: ProductData;
  content: ContentData;
  media: MediaData;
  pricingVariants: PricingVariant[];
  productVariants: ProductVariantData[];
}): string {
  const { product, content, media, pricingVariants, productVariants } = opts;
  const canonicalUrl = `${SITE_URL}/products/${product.handler}/`;

  const graph: Record<string, unknown>[] = [];

  // 1. Organization compact stub
  graph.push(OrganizationCompact);

  // 2. Brand compact stub
  graph.push(BrandCompact);

  // 3. OnlineStore compact stub
  graph.push(OnlineStoreCompact);

  // 4. ImageObject — product group main image
  const imageNode = {
    "@type": "ImageObject",
    "@id": `${canonicalUrl}#image`,
    url: media.image.url,
    contentUrl: media.image.url,
    caption: media.image.caption,
    width: media.image.width,
    height: media.image.height,
    encodingFormat: media.image.encodingFormat,
    creator: { "@id": `${SITE_URL}/#organization` },
  };
  graph.push(imageNode);

  // 5. ProductGroup — root product node (must precede variants)
  const variantIds: Array<{ "@id": string }> = pricingVariants.map((pv) => ({
    "@id": `${canonicalUrl}#variant-${pv.sku}`,
  }));

  const productGroupNode: Record<string, unknown> = {
    "@type": "ProductGroup",
    "@id": `${canonicalUrl}#product-group`,
    name: product.name,
    description: content.shortDescription,
    brand: { "@id": `${SITE_URL}/#brand` },
    manufacturer: { "@id": `${SITE_URL}/#organization` },
    url: canonicalUrl,
    image: { "@id": `${canonicalUrl}#image` },
    variesBy: ["https://schema.org/size"],
    hasVariant: variantIds,
    productGroupID: product.productGroupId,
    countryOfOrigin: { "@type": "Country", name: "Honduras" },
    category: content.category,
    ...(content.material && { material: content.material }),
    ...(content.tags?.length && { keywords: content.tags.join(", ") }),
  };

  const additionalProperties: Record<string, unknown>[] = [];
  if (product.botanicalName) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Botanical Name",
      value: product.botanicalName,
    });
  }
  if (content.qualityBadge) {
    additionalProperties.push({
      "@type": "PropertyValue",
      name: "Quality",
      value: content.qualityBadge,
    });
  }
  if (additionalProperties.length) {
    productGroupNode.additionalProperty = additionalProperties;
  }

  if (content.audience) {
    productGroupNode.audience = {
      "@type": "PeopleAudience",
      ...(content.audience.suggestedGender && {
        suggestedGender: content.audience.suggestedGender,
      }),
      ...(content.audience.suggestedMinAge != null && {
        suggestedMinAge: content.audience.suggestedMinAge,
      }),
    };
  }

  graph.push(productGroupNode);

  // 6. Product variants — full nodes, sorted by size (order matches pricingVariants)
  for (const pv of pricingVariants) {
    const variantId = `${canonicalUrl}#variant-${pv.sku}`;
    const prodVariant = productVariants.find((v) => v.sku === pv.sku);
    const variantImage = media.variantImages.find((v) => v.sku === pv.sku);

    const variantNode: Record<string, unknown> = {
      "@type": "Product",
      "@id": variantId,
      name: pv.skuName,
      description: content.shortDescription,
      sku: pv.sku,
      brand: { "@id": `${SITE_URL}/#brand` },
      category: content.category,
      size: prodVariant?.size,
      ...(prodVariant?.weightKg != null && {
        weight: {
          "@type": "QuantitativeValue",
          value: prodVariant.weightKg,
          unitCode: "KGM",
        },
      }),
      image: variantImage?.url ?? media.image.url,
      isVariantOf: { "@id": `${canonicalUrl}#product-group` },
      offers: {
        "@type": "Offer",
        price: pv.price,
        priceCurrency: pv.currency,
        availability:
          prodVariant?.availability === "OutOfStock"
            ? "https://schema.org/OutOfStock"
            : "https://schema.org/InStock",
        itemCondition: "https://schema.org/NewCondition",
        priceValidUntil: "2026-12-31",
        url: canonicalUrl,
        seller: { "@id": `${SITE_URL}/#organization` },
        shippingDetails: shippingIdRefs,
        hasMerchantReturnPolicy: returnPolicyRef,
      },
    };

    graph.push(variantNode);
  }

  // 7. OfferShippingDetails x8
  graph.push(...shippingNodes);

  // 7. MerchantReturnPolicy
  graph.push(returnPolicyNode);

  // 8. BreadcrumbList — Home → Catalog → Product Name
  const catalogUrl = catalogUrls[product.catalog] ?? `${SITE_URL}/products/`;
  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: product.catalog, item: catalogUrl },
      { "@type": "ListItem", position: 3, name: product.name },
    ],
  });

  // 9. HowTo (if howToUse data exists)
  if (content.howToUse && content.howToUse.length > 0) {
    const steps = content.howToUse.map((step, i) => {
      const colonIdx = step.indexOf(":");
      let name: string;
      let text: string;

      if (colonIdx > 0 && colonIdx < 60) {
        // "Name: Description" pattern
        name = step.slice(0, colonIdx).trim();
        text = step.slice(colonIdx + 1).trim();
      } else {
        // No clear name — use "Step N"
        name = `Step ${i + 1}`;
        text = step;
      }

      return { "@type": "HowToStep", position: i + 1, name, text };
    });

    graph.push({
      "@type": "HowTo",
      "@id": `${canonicalUrl}#how-to-use`,
      name: `How to Use ${product.name}`,
      step: steps,
    });
  }

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}

// ─── Shop page @graph builder ───────────────────────────────────────────────

export function buildShopPageGraph(
  allProducts: Array<{
    handler: string;
    name: string;
    imageUrl: string;
  }>,
): string {
  const shopUrl = `${SITE_URL}/products/`;
  const graph: Record<string, unknown>[] = [];

  // Organization + Brand compact stubs
  graph.push(OrganizationCompact);
  graph.push(BrandCompact);

  // OnlineStore (strip @context)
  const { "@context": _, ...onlineStore } = OnlineStoreFull as Record<string, unknown>;
  graph.push(onlineStore);

  // CollectionPage
  graph.push({
    "@type": "CollectionPage",
    "@id": `${shopUrl}#collection`,
    name: "Products",
    url: shopUrl,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    about: { "@id": `${SITE_URL}/#organization` },
    description: `Browse our full catalog of ${allProducts.length} premium ethnobotanical products — Batana Oil, Stingless Bee Honey, and Traditional Wildcrafted Herbs from Honduras.`,
  });

  // ItemList with all products — each item references the PDP's ProductGroup @id
  const listItems = allProducts.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@id": `${SITE_URL}/products/${p.handler}/#product-group`,
      name: p.name,
      image: p.imageUrl,
    },
  }));

  graph.push({
    "@type": "ItemList",
    "@id": `${shopUrl}#product-list`,
    numberOfItems: allProducts.length,
    itemListElement: listItems,
  });

  // OfferShippingDetails x9
  graph.push(...shippingNodes);

  // MerchantReturnPolicy
  graph.push(returnPolicyNode);

  // BreadcrumbList — Home → Products
  graph.push({
    "@type": "BreadcrumbList",
    "@id": `${shopUrl}#breadcrumb`,
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Products" },
    ],
  });

  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph });
}
