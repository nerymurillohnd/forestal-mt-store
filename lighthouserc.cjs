module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:4321/",
        "http://localhost:4321/about/",
        "http://localhost:4321/batana-oil/",
        "http://localhost:4321/contact/",
      ],
      startServerCommand: "pnpm build && pnpm preview",
      startServerReadyPattern: "Local:",
      startServerReadyTimeout: 60000,
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--headless --no-sandbox",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        "categories:seo": ["error", { minScore: 0.95 }],
      },
    },
    upload: {
      target: "temporary-public-storage",
    },
  },
};
