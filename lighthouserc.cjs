module.exports = {
  ci: {
    collect: {
      url: [
        "http://localhost:4321/",
        "http://localhost:4321/about/",
        "http://localhost:4321/batana-oil/",
        "http://localhost:4321/stingless-bee-honey/",
        "http://localhost:4321/traditional-herbs/",
        "http://localhost:4321/community/",
        "http://localhost:4321/contact/",
      ],
      startServerCommand: "npx serve dist -l 4321",
      startServerReadyPattern: "Accepting connections",
      startServerReadyTimeout: 30000,
      numberOfRuns: 1,
      settings: {
        preset: "desktop",
        chromeFlags: "--headless --no-sandbox",
      },
    },
    assert: {
      assertions: {
        // CI runs on localhost without Cloudflare CDN, image optimization, or HTTP/2.
        // Homepage has a video hero (HLS.js). Real production scores are materially higher.
        "categories:performance": ["error", { minScore: 0.7 }],
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
