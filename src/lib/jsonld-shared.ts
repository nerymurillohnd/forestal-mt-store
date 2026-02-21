/**
 * Shared JSON-LD constants — single source of truth for @id references
 * and compact entity stubs used across page and product builders.
 */

export const SITE_URL = "https://forestal-mt.com";

/** Compact Organization stub for non-home pages */
export const OrganizationCompact = {
  "@type": "Organization" as const,
  "@id": `${SITE_URL}/#organization`,
  name: "Forestal MT",
  url: SITE_URL,
  logo: { "@id": `${SITE_URL}/#logo` },
};

/** Compact Brand stub for non-home pages */
export const BrandCompact = {
  "@type": "Brand" as const,
  "@id": `${SITE_URL}/#brand`,
  name: "Forestal MT",
  url: SITE_URL,
};

/** Compact OnlineStore stub for PDP pages */
export const OnlineStoreCompact = {
  "@type": "OnlineStore" as const,
  "@id": `${SITE_URL}/#online-store`,
  name: "Forestal MT Shop",
  url: `${SITE_URL}/products/`,
  parentOrganization: { "@id": `${SITE_URL}/#organization` },
};
