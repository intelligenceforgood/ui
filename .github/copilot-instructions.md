# Copilot Instructions for i4g/ui

**Unified Workspace Context:** This repository is part of the `i4g` multi-root workspace. Shared coding standards, routines, and platform context live in the `copilot/` repo. These instructions contain only repo-specific context.

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
- API calls proxy through Next.js routes to the FastAPI backend — see `copilot/.github/s- API calls proxy through Next.js routes to the FastAPI backend — see `copilote- API calls proxy through Next.ith - API calls proxy through Next.js routes to the FastAPI backend — see `copilot/.github/s- API calls proxy through Next.js routes to the FastAPI backend — see `copilote- API calls proxy through Next.ith - API calls proxy thfor c- API callsypes/- API calls proxy through Next.js routes nts.- API calls proxy throug wit- API calls proxy through Ne only when children ar- API calls prMov- APIive- API calls proxy through Next.js rouS Module- API calls proxy through Next.jsfaces ov- API calls proxy through Next.js routes to the FastAPI backend — see `copil.
- API calls proxy through Next.js rboard support, `alt` text on images. - API calls proxy through Next.js rboard support, `alt` textr - ild- API callsd ui/     # MUST run from ui/, not workspace root
scripts/build_image.sh i4g-console dev
```

## Pre-Merge

Run `pnpm format`, `pnpm lint`, and `pnpm build` before merging. For a full pre-merge review, use the `pre-merge-review` routine and the checklist in `copilot/.github/shared/pre-merge-checklist.instructions.md`.

## Coding Standards

Follow `copilot/.github/shared/general-coding.instructions.md` for all shared language standards.
