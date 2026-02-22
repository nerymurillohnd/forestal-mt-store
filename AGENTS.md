# Repository Guidelines

## Project Structure & Module Organization

- Core site code is in `src/`:
  - `src/pages/`: route files
  - `src/components/`: shared and island components (`src/components/islands/` for client-side Preact)
  - `src/layouts/`, `src/lib/`: layout shells and shared utilities
  - `src/data/` and `src/content/`: product/content data used at build time
- SEO, docs, and architecture references are in `docs/`, `SITE_URL_MANIFEST.md`, and `SITE_TECHNICAL_SPEC.md`.
- Static assets: `public/` (favicons only) and `src/assets/` (local fonts/branding files).
- `functions/` contains Cloudflare Pages Functions; `api-worker/` is the separate Worker package for backend/API work.
- Keep `dist/` as build output only; do not edit generated files manually.

## Build, Test, and Development Commands

- Execution environment baseline:
  - Project runs in WSL2 (`Linux`), `Ubuntu 24.04 LTS`.
  - Working shell: `bash`.
  - Package manager mode: `pnpm standalone` only (`/home/nmurillo/.local/share/pnpm/pnpm`).
  - Never run project workflows with `npm`/`yarn`; use `pnpm` and `pnpm exec` consistently to avoid mismatched execution.

- Workspace scope is explicit:
  - Root workspace: `.` (site app)
  - API workspace: `api-worker/` (Cloudflare Worker/API package)

### Workspace execution rule

- Commands for `api-worker` must be run only from a session started inside `api-worker/` (e.g. `cd api-worker && pnpm ...`).
- Do not run `api-worker`-specific commands from repository root unless explicitly scoped with workspace filters.

- `pnpm install` — install dependencies with the workspace lockfile.
- `pnpm dev` — run Astro dev server (port 4321; predev clears stale port processes).
- `pnpm build` — production build to `dist/` (required before PRs).
- `pnpm preview` — preview the built site with remote Cloudflare runtime bindings.
- `pnpm check` — Astro type check.
- `pnpm lint` / `pnpm lint:fix` — ESLint checks/fixes.
- `pnpm format` / `pnpm format:check` — apply/verify Prettier formatting.
- `pnpm quality:prepush` — local pre-push quality gate (`format:check`, `lint`, `check`) used by `.husky/pre-push`.
- `pnpm test:e2e` / `pnpm test:e2e:ui` — Playwright e2e tests (UI mode optional).
- `pnpm lighthouse` and `pnpm lighthouse:prod` — performance/audit checks (local vs production config).
- `pnpm -C api-worker ...` is avoided by policy; use session-local execution inside `api-worker/`.

## Coding Style & Naming Conventions

- Language: TypeScript-first (Astro + Preact), minimal JavaScript.
- Use Prettier defaults from `.prettierrc`:
  - `tabWidth: 2`, semicolons required, double quotes, `trailingComma: all`, print width `100`.
- ESLint uses `@eslint/js`, `typescript-eslint`, `eslint-plugin-astro`, and `jsx-a11y`.
- Naming: PascalCase for components, camelCase for variables/functions, kebab-case for route paths/asset names, and explicit names for handlers/events.
- Avoid React conventions; islands use Preact in `src/components/islands/`.

## Testing Guidelines

- Testing stack: Playwright + axe-core (`tests/e2e/*.spec.ts`).
- Keep e2e tests close to scenario coverage (live page smoke, SEO metadata, accessibility assertions).
- Name files with `.spec.ts` and prefer deterministic, readable test titles.
- When touching user-facing behavior, include at least one relevant e2e update.

## SEO / Content Quality Gate

- For any route, metadata, or content-file change (MDX/JSON data, hero assets, schema):
  - verify canonical tag points to the exact production URL,
  - verify page title and meta description exist and are production-ready,
  - verify JSON-LD script output is present on the page,
  - verify social fields (`og:title`, `og:description`) match frontmatter intent.
- If OG fields and frontmatter copy differ, PR must include a reviewer note explaining the exception.

## Communication and Deliverable Language

- Conversations between Nery and me/I may be in Spanish or English, and must follow the user’s spoken language.

## Commit & Pull Request Guidelines

- Existing history follows Conventional-style messages, e.g. `feat(shop): ...`, `fix(ci): ...`, `refactor(design): ...`.
- PRs should include:
  - short purpose statement and impact summary,
  - scope of files changed,
  - evidence of checks:
    - `pnpm lint` + `pnpm check` (CI lint/build verification),
    - `pnpm quality:prepush` before push,
    - and tests when applicable.
  - visual notes/screenshots for UI changes.
- This repo’s CI blocking gates are lint → build → e2e (with `lighthouse` running on push/main). `lighthouse:prod` remains post-deploy and non-blocking.

## Security & Configuration Notes

- Never commit secrets. Use env vars / CI secrets and worker bindings.
- Keep runtime credentials and API keys out of source files and docs.
- For backend/API changes, validate whether work belongs in `api-worker/` before editing root `src`.
