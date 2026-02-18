import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const pages = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "src/content/pages" }),
  schema: z.object({
    // Routing
    slug: z.string(),
    pageName: z.string(),
    canonicalUrl: z.string(),
    rendering: z.enum(["SSG", "SSR"]),

    // SEO
    title: z.string(),
    description: z.string(),
    seo: z
      .object({
        tags: z.array(z.string()).optional(),
      })
      .optional(),

    // Open Graph
    og: z.object({
      title: z.string(),
      description: z.string(),
      image: z.object({
        url: z.string(),
        alt: z.string(),
        width: z.number(),
        height: z.number(),
      }),
    }),
    twitter: z.object({
      card: z.string(),
    }),

    // JSON-LD schemas
    schemas: z.array(
      z.object({
        type: z.string(),
        id: z.string(),
        mode: z.string().optional(),
      }),
    ),

    // Hero
    media: z.enum(["image", "video"]).optional(),
    hero: z.object({
      eyebrow: z.string().optional(),
      title: z.string(),
      subtitle: z.string().optional(),
      description: z.string().optional(),
      body: z.string().optional(),
      ctas: z
        .array(
          z.object({
            label: z.string(),
            url: z.string(),
          }),
        )
        .optional(),
      background: z
        .object({
          type: z.enum(["image", "video"]),
          url: z.string().optional(),
          stream: z.string().optional(),
          alt: z.string().optional(),
          caption: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
        .optional(),
    }),
  }),
});

export const collections = { pages };
