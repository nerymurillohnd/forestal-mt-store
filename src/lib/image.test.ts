import { describe, expect, it } from "vitest";
import * as imageModule from "./image";
import { cdnImage, sanitizeOrigin } from "./image";

describe("sanitizeOrigin", () => {
  it("throws when the value is empty", () => {
    expect(() => sanitizeOrigin("")).toThrow("SITE_URL is required");
  });

  it("throws when the value is undefined", () => {
    expect(() => sanitizeOrigin(undefined)).toThrow("SITE_URL is required");
  });

  it("removes a trailing slash", () => {
    expect(sanitizeOrigin("https://forestal-mt.com/")).toBe("https://forestal-mt.com");
  });

  it("returns the value as-is when already normalized", () => {
    expect(sanitizeOrigin("https://forestal-mt.com")).toBe("https://forestal-mt.com");
  });

  it("does not export cdnPicture", () => {
    const moduleExports = imageModule as Record<string, unknown>;
    expect(typeof moduleExports.cdnPicture).toBe("undefined");
  });
});

describe("cdnImage", () => {
  it("returns empty string when input is empty", () => {
    expect(cdnImage("")).toBe("");
  });

  it("keeps already transformed URLs unchanged", () => {
    const transformed = "https://forestal-mt.com/cdn-cgi/image/width=800,format=webp/image.jpg";
    expect(cdnImage(transformed)).toBe(transformed);
  });

  it("wraps normal R2 URL with transformation", () => {
    expect(cdnImage("https://cdn.forestal-mt.com/pages/about/hero.jpg", { w: 800 })).toBe(
      "https://forestal-mt.com/cdn-cgi/image/width=800,format=auto/https://cdn.forestal-mt.com/pages/about/hero.jpg",
    );
  });

  it("wraps external domain URLs as well", () => {
    expect(cdnImage("https://external.example.com/photo.jpg", { w: 400 })).toBe(
      "https://forestal-mt.com/cdn-cgi/image/width=400,format=auto/https://external.example.com/photo.jpg",
    );
  });
});
