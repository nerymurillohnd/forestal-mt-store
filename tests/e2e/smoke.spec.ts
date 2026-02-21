import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const LIVE_PAGES = [
  { path: "/", title: "Forestal MT" },
  { path: "/about/", title: "About" },
  { path: "/batana-oil/", title: "Batana Oil" },
  { path: "/stingless-bee-honey/", title: "Stingless Bee Honey" },
  { path: "/traditional-herbs/", title: "Traditional Herbs" },
  { path: "/contact/", title: "Contact" },
  { path: "/wholesale/", title: "Wholesale" },
  { path: "/community/", title: "Community" },
  { path: "/community/faqs/", title: "FAQ" },
  { path: "/community/blog/", title: "Blog" },
  { path: "/community/testimonials/", title: "Testimonials" },
  { path: "/community/docs/", title: "TDS & SDS" },
  { path: "/products/", title: "Products" },
  { path: "/terms/", title: "Terms" },
  { path: "/privacy/", title: "Privacy" },
  { path: "/disclaimer/", title: "Disclaimer" },
  { path: "/shipping/", title: "Shipping" },
];

test.describe("Smoke tests — all live pages load", () => {
  for (const page of LIVE_PAGES) {
    test(`${page.path} returns 200 and has title`, async ({ page: p }) => {
      const response = await p.goto(page.path);
      expect(response?.status()).toBe(200);
      await expect(p).toHaveTitle(new RegExp(page.title, "i"));
    });
  }
});

test.describe("SEO essentials", () => {
  for (const page of LIVE_PAGES) {
    test(`${page.path} has meta description`, async ({ page: p }) => {
      await p.goto(page.path);
      const description = p.locator('meta[name="description"]');
      await expect(description).toHaveAttribute("content", /.{20,}/);
    });

    test(`${page.path} has canonical URL`, async ({ page: p }) => {
      await p.goto(page.path);
      const canonical = p.locator('link[rel="canonical"]');
      await expect(canonical).toHaveAttribute("href", /https:\/\/forestal-mt\.com/);
    });

    test(`${page.path} has JSON-LD`, async ({ page: p }) => {
      await p.goto(page.path);
      const jsonld = p.locator('script[type="application/ld+json"]');
      expect(await jsonld.count()).toBeGreaterThan(0);
    });
  }
});

test.describe("Accessibility — axe-core", () => {
  for (const page of LIVE_PAGES) {
    test(`${page.path} has no critical a11y violations`, async ({ page: p }) => {
      await p.goto(page.path);
      const results = await new AxeBuilder({ page: p }).withTags(["wcag2a", "wcag2aa"]).analyze();
      expect(results.violations.filter((v) => v.impact === "critical")).toEqual([]);
    });
  }
});

test.describe("Layout components", () => {
  test("Header is present with logo", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("header")).toBeVisible();
    await expect(page.locator("header nav a[href='/'] img")).toBeVisible();
  });

  test("Footer is present with social links", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toBeVisible();
    await expect(page.locator('footer a[href*="facebook.com"]')).toBeVisible();
    await expect(page.locator('footer a[href*="instagram.com"]')).toBeVisible();
  });

  test("Footer has payment methods", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("footer")).toContainText("Moneygram");
    await expect(page.locator("footer")).toContainText("WU");
  });
});
