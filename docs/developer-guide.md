# Developer Guide

_Last updated: 2025-11-19_

This guide captures day-to-day workflows for building, testing, and deploying the Intelligence for Good analyst console.

## Setup Checklist

1. **Install prerequisites**
   - Node.js 20+
   - PNPM 9 (`corepack enable`)
   - Mac users: `brew install watchman` for faster file watching (optional)
2. **Install dependencies**
   ```bash
   pnpm install
   ```
3. **Create an environment file**
   ```bash
   cd apps/web
   cp .env.example .env.local
   ```
   - Set `NEXT_PUBLIC_USE_MOCK_DATA=true` for the mock dataset.
   - When calling a real backend, set `NEXT_PUBLIC_API_BASE_URL` (client-visible URL) and `I4G_API_URL`/`I4G_API_KEY` (server-only credentials). Use `I4G_API_KIND=core` to target the FastAPI `/reviews` endpoints.
4. **Start the dev server**
   ```bash
   pnpm --filter web dev
   ```
   The console is available at http://localhost:3000. Navigation, search, cases, taxonomy, and analytics are populated via mock data unless you configure a backend.

## Mock vs Live Backend

| Scenario               | Configuration                                                                                               | Notes                                                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Rapid prototyping/demo | `NEXT_PUBLIC_USE_MOCK_DATA=true`                                                                            | No other env needed. Mock dataset lives in `@i4g/sdk` and mirrors backend schemas.                                   |
| Local FastAPI dev      | `NEXT_PUBLIC_USE_MOCK_DATA=false` + `NEXT_PUBLIC_API_BASE_URL=http://localhost:8000`                        | The UI calls Next.js API routes (`/api/search`, etc.), which forward to FastAPI using `I4G_API_URL` / `I4G_API_KEY`. |
| Production             | `NEXT_PUBLIC_USE_MOCK_DATA=false` + `I4G_API_URL=https://api.intelligenceforgood.org` + `I4G_API_KIND=core` | Set secrets in the hosting platform. Avoid exposing API keys with the `NEXT_PUBLIC_*` prefix.                        |

## Available Scripts

```bash
pnpm --filter web dev        # Next.js dev server
pnpm --filter web build      # Production build
pnpm --filter web start      # Run built app locally
pnpm --filter web lint       # ESLint (Next.js + Tailwind rules)
pnpm --filter web test       # Vitest unit tests
```

Turborepo orchestrates cross-package commands:

```bash
pnpm dev    # turbo dev
pnpm lint   # turbo lint (all workspaces)
pnpm test   # turbo test
```

## Testing

### Unit/UI (Vitest)

- Source files: `apps/web/tests/**/*.test.tsx`
- Environment: jsdom, `@testing-library/react`
- Setup file: `vitest.setup.ts`
- Add new suites next to the feature (e.g., `tests/search/*`).

Run with watch mode for TDD:

```bash
pnpm --filter web test:watch
```

### Playwright (Planned)

- `@playwright/test` is installed. Add `playwright.config.ts` and tests under `apps/web/e2e` when we have stable flows.
- Install browsers: `npx playwright install --with-deps`

### Linting & Formatting

- `pnpm --filter web lint`
- `pnpm format` (Prettier at the repo root)

## Directory Conventions

- **apps/web/src/app/** – App Router routes. Each console section (dashboard, search, etc.) lives under `(console)/`.
- **apps/web/src/lib/** – Thin wrappers (e.g., `getI4GClient`) that switch between mock/live data sources.
- **packages/ui-kit/** – Shared components. Keep class names Tailwind-friendly; update `tailwind.config.ts` if you add new folders.
- **packages/sdk/** – Typed client. Update zod schemas alongside FastAPI contracts. Expose `createMockClient` helpers for reliable mocks.

## Adding a New Page

1. Create a folder under `apps/web/src/app/(console)/<route>` with a `page.tsx` (server component).
2. Import `getI4GClient()` to fetch data inside the server component.
3. Use UI kit primitives (`@i4g/ui-kit`) for consistent styling.
4. If the page needs client-side interactivity, split into `page.tsx` (data load) and a colocated client component.
5. Add unit tests for non-trivial client logic.
6. Update navigation in `(console)/layout.tsx` if the page should appear in the side rail.

## Integrating with FastAPI

1. Expose an endpoint in FastAPI (e.g., `/dashboard/overview`).
2. Update the corresponding zod schema in `@i4g/sdk` if the contract changes.
3. Implement a function on the SDK client (e.g., `getDashboardOverview`).
4. Ensure Next.js API routes call the SDK; add a unit test covering success/error handling.
5. Configure environment variables so the UI can reach the backend.

## Troubleshooting

- **Missing Tailwind classes on shared components:** confirm `tailwind.config.ts` includes `../../packages/ui-kit/src/**/*` in the `content` array.
- **API calls fail locally:** ensure `I4G_API_URL` points to the FastAPI origin accessible from Node (can differ from the browser base URL).
- **Type mismatches when backend changes:** update zod schemas in `@i4g/sdk` _before_ running TypeScript; schema parsing will throw in dev, surfacing mismatches early.
- **Fonts look incorrect:** verify `next/font` imports in `app/layout.tsx` and ensure `globals.css` uses the CSS variables (`--font-sans`, `--font-display`).

## Deployment Notes

- Use `pnpm --filter web build` to generate the `.next` output.
- The repository ships with a multi-stage Dockerfile at `docker/ui-console.Dockerfile` (see `docs/deployment-guide.md` for usage).
- Keep secrets out of the client bundle; store keys in the hosting platform and pass them only as server-side env vars.

Refer to `docs/ui_architecture.md` for roadmap-level decisions.
