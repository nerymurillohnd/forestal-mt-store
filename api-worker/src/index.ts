import { Hono } from "hono";
import { cors } from "hono/cors";

export interface Env {
  DB: D1Database;
  R2: R2Bucket;
  ENVIRONMENT: string;
}

const app = new Hono<{ Bindings: Env }>();

app.use(
  "*",
  cors({
    origin: ["https://forestal-mt.com", "http://localhost:4321"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);

app.get("/api/health", (c) => {
  return c.json({ status: "ok", env: c.env.ENVIRONMENT });
});

// TODO: mount routers — /api/products, /api/search, /api/cart, /api/orders

export default app;
