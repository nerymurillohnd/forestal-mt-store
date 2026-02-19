import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./api-worker/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: "73979325-5642-4263-8146-a13f20b36ea6",
    token: process.env.CLOUDFLARE_API_TOKEN!,
  },
});
