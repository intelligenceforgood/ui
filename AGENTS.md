# UI — Repo Context

> **For the Antigravity Agent:** Auto-read this file when working in the `ui/` repo. For UI↔API proxy routing and the three-layer proxy chain, read `antigravity/knowledge/architecture/architecture.md`.

## Environment

- **Language:** TypeScript / React (Next.js)
- **Package manager:** pnpm
- **All commands:** run from the `ui/` directory

## Build & Test

```bash
pnpm install          # install dependencies
pnpm dev              # start dev server
pnpm format           # ALWAYS run after editing any file — Prettier enforced
pnpm lint             # eslint check
pnpm test             # unit tests
pnpm build            # full build (also catches type errors)
```

## Architecture

- **App root:** `apps/web/` (Next.js)
- **Shared packages:** `packages/` (UI kit, API client, types)
- API calls proxy through Next.js routes to the FastAPI backend — see `antigravity/knowledge/architecture/architecture.md` §1 for the full proxy chain.
- Ensure accessibility features like keyboard support and `alt` text on images are implemented.

## Docker Build

```bash
cd ui/ # MUST run from ui/, not workspace root
scripts/build_image.sh i4g-console dev
```

## Pre-Merge

Run `pnpm format`, `pnpm lint`, and `pnpm build` before merging.

## Coding Standards

- For TypeScript/React conventions, read `antigravity/knowledge/standards/typescript.md`
