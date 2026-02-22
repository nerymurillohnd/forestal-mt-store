import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
  define: {
    "import.meta.env.SITE_URL": JSON.stringify("https://forestal-mt.com"),
  },
});
