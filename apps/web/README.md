## Web Console (apps/web)

Next.js 15 console for the hybrid search milestone. Everything runs inside the repo root using `pnpm@9`.

### Local development

```bash
pnpm --filter web dev
```

By default the app bootstraps against the mock API client unless `I4G_API_URL` is set. Use `pnpm --filter web build` followed by `pnpm --filter web start` for a production-like run.

### Testing

- `pnpm --filter web test` — Vitest + Testing Library unit suite (jsdom environment, coverage ready)
- `pnpm --filter web test:smoke` — Playwright smoke check that boots the Next dev server and verifies the search console renders. Run `pnpm --filter web exec playwright install --with-deps` once per machine to install browsers.

Both commands respect the same environment variables as the Next.js app, so you can point them at a live API by exporting `I4G_API_URL`/`I4G_API_KEY` first.
