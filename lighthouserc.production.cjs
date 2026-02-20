module.exports = {
  ci: {
    collect: {
      url: [
        "https://forestal-mt.com/",
        "https://forestal-mt.com/about/",
        "https://forestal-mt.com/batana-oil/",
        "https://forestal-mt.com/stingless-bee-honey/",
        "https://forestal-mt.com/traditional-herbs/",
        "https://forestal-mt.com/community/",
        "https://forestal-mt.com/contact/",
        "https://forestal-mt.com/products/",
      ],
      numberOfRuns: 3,
      settings: {
        preset: "desktop",
        chromeFlags: "--headless --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.85 }],
        "categories:accessibility": ["error", { minScore: 0.95 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: { target: "temporary-public-storage" },
  },
};
