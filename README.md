# i4g UI Monorepo

Proposed structure for the next-generation analyst experience. This workspace uses PNPM workspaces + Turborepo to host multiple frontend applications and shared packages.

## Layout

```text
ui/
├── apps/
│   └── web/        # Next.js 14 (App Router) analyst console
├── packages/
│   ├── ui-kit/     # Shared design system components + Tailwind theme tokens
│   ├── sdk/        # TypeScript client for FastAPI/Cloud Run endpoints
│   └── config/     # ESLint, TypeScript, Tailwind configs reused across apps
├── package.json    # Turborepo scripts (dev/build/lint/test)
└── pnpm-workspace.yaml
```

Additional apps (e.g., Expo mobile shell or Storybook) can be added under `apps/`. Shared utilities live in `packages/` so the React Native build can re-use them without pulling web-only dependencies.

## Getting Started

1. Install PNPM 9 (or run `corepack enable`).
2. From this directory, run `pnpm install` to bootstrap the workspace.
3. Scaffold the web app with Next.js once ready:
   ```bash
   pnpm dlx create-next-app@latest apps/web --ts --eslint --tailwind --src-dir --app --import-alias "@/*"
   ```
4. Add `turbo.json`, `tsconfig.base.json`, Tailwind config, etc., following the architecture memo in `docs/ui_architecture.md` (to be added).

## Next Steps

- Import brand assets from `../dtp/Logos` and derive Tailwind theme tokens (colors, fonts).
- Build shared UI primitives in `packages/ui-kit` using Radix UI + Tailwind.
- Implement API client hooks (`packages/sdk`) with TanStack Query & zod validation.
- Connect the web app to the Python backend via REST (and future WebSocket channels).
- Add i18n scaffolding (next-i18next) so locales can be expanded easily.
