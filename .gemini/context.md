# Gemini Code Assist Context for i4g/ui

**Unified Workspace Context:** This repository is part of the unified `i4g` parent workspace. Shared coding standards, routines, and platform context live in the `gemini` repo's styles directory (symlinked at the parent root). GCA will implicitly apply this file's context whenever you work within the `ui/` directory.

## GCA Framework & Workflows

- **Agent Mode Management:** Keep Agent Mode **OFF** for standard queries, isolated code reviews, and planning to conserve quota. Toggle **ON** strictly for autonomous multi-file execution or terminal tasks.
- **Standardized Prompts:** Use the standard VSCode snippets (`gca-plan`, `gca-prd`, `gca-impl`, `gca-work`) to trigger routine workflows.
- **Global Standards:** Broad coding conventions are referenced from `.gemini/styles/` (symlinked to the `gemini` repository).

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
- API calls proxy through Next.js routes to the FastAPI backend — see `.gemini/styles/`.
- Ensure accessibility features like keyboard support and `alt` text on images are implemented.

## Docker Build

```bash
cd ui/ # MUST run from ui/, not workspace root
scripts/build_image.sh i4g-console dev
```

## Pre-Merge

Run `pnpm format`, `pnpm lint`, and `pnpm build` before merging. For a full pre-merge review, use the `pre-merge-review` routine and the checklist in `copilot/.github/shared/pre-merge-checklist.instructions.md`.

## Coding Standards

Follow `copilot/.github/shared/general-coding.instructions.md` for all shared language standards.

```

```
