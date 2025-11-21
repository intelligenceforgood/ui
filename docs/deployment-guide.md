# Deployment Guide

_Last updated: 2025-11-19_

This guide describes how to produce a production-ready build of the analyst console and run it locally or inside a container. Use it as the source of truth when preparing staging/production releases.

## 1. Build Artifacts

```bash
pnpm install
pnpm --filter web build
```

The command above performs the following:

- Installs dependencies for every workspace in the monorepo.
- Runs `next build`, generating the production bundle under `apps/web/.next`.
- Validates TypeScript types, lints the project, and prerenders static routes.

Artifacts to collect for deployment:

- `apps/web/.next`
- `apps/web/public`
- `apps/web/package.json`
- `apps/web/next.config.ts`
- Root `pnpm-lock.yaml`

## 2. Local Production Preview

After building, you can run the app exactly as production would serve it:

```bash
cd apps/web
pnpm install --prod --ignore-scripts
pnpm start
```

Visit http://localhost:3000 to interact with the optimised build. This is the fastest way to validate feature flags, environment variables, and mock-vs-live data behaviour in a production-like environment.

## 3. Container Image (Cloud Run friendly)

The repository ships with `docker/ui-console.Dockerfile`, a multi-stage image that installs dependencies once, builds the app, and then copies only the runtime assets into the final layer. Because the Dockerfile uses `pnpm install --frozen-lockfile`, make sure the workspace lockfile reflects the latest manifests before building:

```bash
pnpm install
# commit pnpm-lock.yaml when it changes
```

Build, push, and optionally run the container using Docker Buildx (example mirrors the Streamlit workflow):

```bash
docker buildx build \
    --platform linux/amd64 \
    -f docker/ui-console.Dockerfile \
    -t us-central1-docker.pkg.dev/i4g-dev/applications/analyst-console:dev \
    --push .
```

Optional local smoke
```bash
docker run --rm -p 3000:3000 --env-file apps/web/.env.production \
    us-central1-docker.pkg.dev/i4g-dev/applications/analyst-console:dev
```

Adjust image tags/registry as needed. Remember to keep server-only secrets out of `NEXT_PUBLIC_*` variables; pass them with `--env-file` or Cloud Run secrets.

Deploy the image to Cloud Run (kept readable by splitting each environment variable onto its own line):

```bash
gcloud run deploy i4g-console \
    --image us-central1-docker.pkg.dev/i4g-dev/applications/analyst-console:dev \
    --region us-central1 \
    --platform managed \
    --set-env-vars NEXT_PUBLIC_USE_MOCK_DATA=false \
    --set-env-vars I4G_API_URL=https://fastapi-gateway-y5jge5w2cq-uc.a.run.app/ \
    --set-env-vars I4G_API_KIND=proto \
    --set-env-vars I4G_API_KEY=dev-analyst-token
```

## 4. Environment Variables

| Variable | Scope | Description |
| --- | --- | --- |
| `NEXT_PUBLIC_USE_MOCK_DATA` | Client | Toggle between mock SDK responses and live API calls. |
| `NEXT_PUBLIC_API_BASE_URL` | Client | Base URL exposed to the browser when talking to the FastAPI gateway. |
| `I4G_API_URL` | Server | Internal FastAPI origin used by Next.js API routes. |
| `I4G_API_KEY` | Server | Service token injected only on the server. |
| `I4G_API_KIND` | Server | Set to `proto` to call the existing FastAPI (`/reviews/...`) endpoints. Leave unset for the SDK-native API. |

Store server-side secrets (those without `NEXT_PUBLIC_`) in the hosting platform’s secret manager (e.g., Cloud Run secrets, Vercel environment variables).

## 5. Release Checklist

1. `pnpm --filter web lint`
2. `pnpm --filter web test`
3. `pnpm --filter web build`
4. Capture screenshots for the user guide from the production build.
5. Publish container image (Cloud Build, GitHub Actions, or local Docker push).
6. Run smoke tests against the deployed environment (Playwright scenarios once available).

With this process in place, stakeholders can visually validate the UI in a stable environment without relying on the dev server.
