# forestal-mt-store

E-commerce platform for [forestal-mt.com](https://forestal-mt.com) — premium ethnobotanical products sourced directly from indigenous communities in Honduras.

## Stack

- **Framework:** Astro 5.7+ (Islands Architecture)
- **UI:** Preact + Tailwind CSS 4
- **Hosting:** Cloudflare Pages
- **Database:** Cloudflare D1
- **Storage:** Cloudflare R2 (`cdn.forestal-mt.com`)
- **Sessions:** Cloudflare KV
- **Observability:** Sentry

## Development

```bash
pnpm install    # Install dependencies
pnpm dev        # Dev server
pnpm build      # Production build
pnpm preview    # Preview with local Cloudflare bindings
```

## License

Proprietary. See [LICENSE](LICENSE).
