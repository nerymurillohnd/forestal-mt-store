import { describe, expect, it } from "vitest";
import * as imageModule from "./image";
import { sanitizeOrigin } from "./image";

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
    expect(typeof imageModule.cdnPicture).toBe("undefined");
  });
});
