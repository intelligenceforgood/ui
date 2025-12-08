# Analyst UI Architecture Blueprint

_Last updated: 2025-11-19_

## Goals
- Deliver a modern, responsive analyst console that can evolve into a mobile experience without rewriting core UI logic.
- Separate frontend and backend runtimes so deployments stay lean (Node dependencies do not ship with Python services and vice versa).
- Provide a predictable component system that supports theming, accessibility, and future internationalisation.

## Stack Overview
- **App framework:** Next.js 15 (App Router) with React 19 RC + TypeScript. We lean on server components for data-fetching pages and client components for interactive shells.
- **Styling and components:** Tailwind CSS + custom UI kit primitives (built with clsx and class-variance-authority). Design tokens live in `packages/tokens` and feed Tailwind configuration.
- **Data layer:** `@i4g/sdk` (zod-validated REST client). The SDK can call the FastAPI backend or return rich mock data so the UI works offline.
- **State management:** Lightweight React state + hooks within components for now. TanStack Query/Zustand integration is planned when live API latency warrants caching.
- **Forms & validation:** Native React with zod schemas from the SDK. React Hook Form remains on the roadmap for complex form flows.
- **Internationalisation:** Not yet enabled. The layout is locale-ready via App Router segments; add `next-intl` or `next-i18next` when translations arrive.
- **Charts & data viz:** Recharts renders analytics views while respecting Tailwind theming tokens.
- **Authentication:** Requests flow through Next.js API routes (`/app/api/*`). These routes hydrate the SDK with `I4G_API_URL`/`I4G_API_KEY`, keeping credentials on the server.
- **Testing:** Vitest + Testing Library (already active) and Playwright smoke tests (scaffold pending).

## Monorepo Structure
```
ui/
├── apps/
│   ├── web/          # Next.js analyst console
│   └── storybook/    # (optional) component explorer sharing ui-kit
├── packages/
│   ├── ui-kit/       # Tailwind + Radix components, theming, icons
│   ├── sdk/          # Typed API client (REST + future WebSocket) w/ zod
│   ├── tokens/       # Design tokens (colors, spacing, typography, icons)
│   └── config/       # Shared ESLint, TypeScript, Jest/Vitest configs
└── turbo.json        # Task pipeline (build/lint/test/dev)
```

### Why a Separate Repo?
- Python services remain lean—Node modules stay out of `proto/` Docker builds.
- UI changes can build/deploy independently (Vercel preview or Cloud Run container) while still sharing the workspace for design assets.
- Shared packages (`ui-kit`, `tokens`, `sdk`) stay versioned together with the app.

## Deployment
- **Build:** `pnpm install && pnpm --filter web build` outputs `.next` artifacts under `apps/web/.next`.
- **Container:** Multi-stage Dockerfile (`docker/i4g-console.Dockerfile`) copies the built app plus `package.json`/lockfile and installs production dependencies. Schema is baked at build time via `prebuild` (runs `pnpm run schema:sync`); use `pnpm run schema:check` in CI or pre-commit to ensure the generated snapshot matches the source.
- **Hosting:** Cloud Run (recommended) or Vercel. Cloud Run aligns with the backend platform and supports private networking to internal APIs.
- **CI:** GitHub Actions (pending) will execute lint, unit tests, Playwright smoke, and publish images to Artifact Registry.

## Navigation & Layout
Top-level navigation uses a responsive side rail (collapsible on mobile) with tabs for:
1. **Dashboard** – Alerts, intake volume, case backlog, quick actions.
2. **Search** – Structured filters, saved searches, paginated results with summary cards and inline actions.
3. **Cases & Tasks** – Kanban/table views, assignment workflows.
4. **Taxonomy** – Manage fraud types, variant metadata.
5. **Analytics** – Trend charts, segmentation by taxonomy, competition leaderboards (future).

Each page integrates contextual help (linking analysts to doc placeholders under `docs/user-guide.md`). Icons can be swapped for branded assets later.

### Layout Guidelines
- Use responsive grid with consistent spacing (8px base).
- Provide context sections (e.g., filter drawer, result cards) with subtle elevation to guide focus.
- Keep secondary actions tucked into dropdown menus or contextual toolbars to avoid overwhelming analysts.
- Highlight actionable items with vibrant accent buttons (e.g., gradient backgrounds) while keeping text high-contrast for accessibility.

## Internationalisation
- Default locale remains `en`. When adding more locales, create `app/[locale]/layout.tsx` and move pages into the locale segment.
- Candidate libraries: `next-intl` (simpler, App Router-first) or `next-i18next` (if we need deep i18n features).
- Ensure metrics/dates rely on `Intl` helpers (already used in cases/search views) for future locale expansion.

## Mobile Strategy
- Build UI primitives (buttons, cards, typography) in `packages/ui-kit` with platform-agnostic props.
- Share design tokens with a React Native (Expo) app by exporting Tailwind-compatible tokens and a React Native counterpart (via NativeWind or Shopifiy Restyle).
- Keep business logic (e.g., filter configuration, case actions) in `packages/sdk` so both web and mobile call the same typed helpers.

## Brand Integration
- Import color palette and fonts from assets in `../dtp/Logos` (initial analysis shows deep blue and vibrant teal gradients). Create Tailwind token definitions for primary/secondary colors, typography, and iconography.
- Use Heroicons or Phosphor icons temporarily; replace with custom SVGs when branding assets are finalised.

## Next Steps Checklist
- [x] Derive base tokens and configure Tailwind to consume them.
- [x] Scaffold Next.js app and shared packages under Turborepo.
- [x] Build initial Dashboard/Search/Cases/Taxonomy/Analytics pages with mock-backed data.
- [x] Provide mock/live SDK client switching via environment variables.
- [x] Add Vitest + Testing Library coverage for key interactions.
- [ ] Implement authentication handshake with FastAPI (`/api/auth/session`).
- [ ] Add Storybook for `@i4g/ui-kit` components.
- [ ] Wire TanStack Query (or equivalent) for shared caching once API endpoints stabilise.
- [ ] Stand up CI pipeline (lint/test/build/containerise) and deploy preview environments.

This document should evolve as UX research or product requirements expand (competitions, analytics, etc.).
