import { describe, expect, it } from "vitest";
import { resolveCatalogUrl } from "./product-jsonld";

describe("resolveCatalogUrl", () => {
  it("resolves batana-oil catalog slug", () => {
    expect(resolveCatalogUrl("batana-oil")).toBe("https://forestal-mt.com/batana-oil/");
  });

  it("resolves stingless-bee-honey catalog slug", () => {
    expect(resolveCatalogUrl("stingless-bee-honey")).toBe(
      "https://forestal-mt.com/stingless-bee-honey/",
    );
  });

  it("resolves traditional-herbs catalog slug", () => {
    expect(resolveCatalogUrl("traditional-herbs")).toBe(
      "https://forestal-mt.com/traditional-herbs/",
    );
  });

  it("throws when catalog is unknown", () => {
    expect(() => resolveCatalogUrl("unknown-catalog")).toThrow(
      'Unknown catalog "unknown-catalog"',
    );
  });
});
