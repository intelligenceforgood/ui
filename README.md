# i4g Analyst UI

A Turborepo/PNPM monorepo that hosts the next-generation Intelligence for Good analyst console, shared UI kits, design tokens, and an SDK for the FastAPI backend.

## Repository Layout

```text
ui/
├── apps/
│   └── web/            # Next.js 15 analyst console (App Router)
├── packages/
│   ├── ui-kit/         # Tailwind/Radix component primitives used across apps
│   ├── tokens/         # Design tokens (color, typography, spacing)
│   └── sdk/            # Typed REST client + mock data for local development
├── docs/               # Architecture notes, user guides, runbooks
├── turbo.json          # Build/test/lint orchestration
└── pnpm-workspace.yaml
```

## Prerequisites

- Node.js 20+
- PNPM 9 (enable via `corepack enable` if needed)
- Optional: Playwright browsers (`npx playwright install --with-deps`) for E2E smoke tests

## Installation

```bash
pnpm install
```

All workspaces are bootstrapped together (web app, SDK, design system).

## Environment Configuration

Copy the provided example file and adjust values as needed:

```bash
cd apps/web
cp .env.example .env.local
```

Key variables:

- `NEXT_PUBLIC_USE_MOCK_DATA`: leave `true` to use built-in mock data (no backend required).
- `NEXT_PUBLIC_API_BASE_URL`: set to the FastAPI URL (e.g., `http://localhost:8000`) to proxy calls through Next.js API routes.
- `I4G_API_URL` / `I4G_API_KEY`: server-side credentials for production deployments. These must be present for Discovery calls so the `apps/web/src/app/api/discovery/search` route can talk to FastAPI.
- `I4G_API_KIND`: set to `proto` to call the existing FastAPI `/reviews` endpoints. Leave unset to use the SDK-native API.

### Verifying live Discovery traffic

1. Ensure the FastAPI service is running (local `uvicorn i4g.api.app:app --reload` or the shared Cloud Run URL) and that it exposes `/discovery/search`.
2. Set the following variables in `.env.local` for the web app:
	- `NEXT_PUBLIC_USE_MOCK_DATA=false`
	- `NEXT_PUBLIC_API_BASE_URL=<FastAPI URL>` (e.g., `http://localhost:8000` or the Cloud Run hostname)
	- `I4G_API_URL=<FastAPI URL>` and `I4G_API_KEY=<API key>` so server-side routes push authenticated requests.
3. Restart `pnpm --filter web dev` to pick up the vars, then open `http://localhost:3000/discovery` and run a few queries. The request log in FastAPI should show traffic hitting `/discovery/search`.
4. For production/Cloud Run, set the same variables via deployment secrets and confirm the Discovery panel renders results without relying on mock data.

## Developer Workflows

```bash
pnpm --filter web dev     # Run Next.js with hot reload (uses mock data by default)
pnpm --filter web lint    # ESLint (App Router + TypeScript rules)
pnpm --filter web test    # Vitest unit tests (jsdom + Testing Library)
pnpm --filter web build   # Production build for the analyst console
```

To run tasks for every workspace via Turborepo:

```bash
pnpm dev   # turbo dev (all apps)
pnpm lint  # turbo lint across workspaces
pnpm test  # turbo test (currently runs Vitest suite)
```

### Production Preview & Deployment

- `pnpm --filter web build` followed by `pnpm --filter web start` serves the production bundle locally.
- A ready-to-use Dockerfile lives at `docker/ui-console.Dockerfile`; see `docs/deployment-guide.md` for Buildx commands, container pushes, and environment variable guidance.

## Mock vs. Live Data

The SDK (`@i4g/sdk`) provides a typed client and an in-memory mock dataset. By default, the UI uses the mock client so the console is fully interactive without the backend running. When `NEXT_PUBLIC_USE_MOCK_DATA` is set to `false` (and an API URL is provided), the Next.js API routes forward requests to the FastAPI service using secure server-side credentials.

## Testing Strategy

- **Unit/UI tests:** Vitest + Testing Library (see `apps/web/tests`).
- **Integration mocks:** `/app/api/*` routes marshal requests through the SDK so we can swap between mock and live backends.
- **E2E (planned):** Playwright config lives beside the web app; smoke scenarios will assert navigation, search flows, and data visualisation once CI runners are ready.

## Documentation

- `docs/ui_architecture.md`: architecture blueprint and technical rationale.
- `docs/developer-guide.md`: step-by-step setup, workflows, and troubleshooting.
- `docs/user-guide.md`: analyst-facing walkthrough with screenshot placeholders.
- `docs/deployment-guide.md`: production build, containerisation, and release checklist.

Contributions should update the relevant documentation alongside code changes.

## Next Steps

- Hook the SDK to authenticated FastAPI endpoints.
- Expand the design token catalogue and theme support.
- Add Storybook for the UI kit and ship more component coverage.
- Stand up automated Playwright smoke tests in CI.
