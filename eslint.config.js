import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      "astro/no-set-html-directive": "off",
    },
  },
  {
    files: ["**/*.tsx", "**/*.jsx"],
    plugins: { "jsx-a11y": jsxA11y },
    rules: {
      ...jsxA11y.configs.recommended.rules,
    },
  },
  {
    files: ["*.cjs", "**/*.cjs", "*.mjs", "**/*.mjs", "astro.config.mjs"],
    languageOptions: {
      globals: {
        module: "readonly",
        process: "readonly",
      },
    },
  },
  {
    files: ["functions/**/*.js"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  {
    ignores: [
      "dist/",
      ".astro/",
      "node_modules/",
      ".playwright-mcp/",
      "api-worker/",
      ".worktrees/",
    ],
  },
];
