# Analyst UI Architecture Blueprint

_Last updated: 2025-11-19_

## Goals
- Deliver a modern, responsive analyst console that can evolve into a mobile experience without rewriting core UI logic.
- Separate frontend and backend runtimes so deployments stay lean (Node dependencies do not ship with Python services and vice versa).
- Provide a predictable component system that supports theming, accessibility, and future internationalisation.

## Stack Overview
- **App framework:** Next.js 14 (App Router) with React 18 + TypeScript. Provides SSR/ISR for fast first paint and SEO-ready routes for the public marketing site if needed.
- **Styling and components:** Tailwind CSS + Radix UI primitives for accessible building blocks. Use design tokens (colors, spacing, typography) derived from assets in `dtp/Logos`.
- **State management:** TanStack Query for server state + React Context/Zustand for client state (e.g., filters). Keeps fetch and caching logic consistent across web and mobile.
- **Forms & validation:** React Hook Form + zod. Enables shared schema definitions between the TypeScript SDK and backend Pydantic models.
- **i18n:** next-i18next (i18next under the hood). Locale resources stored alongside route segments to keep bundles small; future languages add JSON translation files.
- **Charts & data viz:** Tremor or Recharts layered on Tailwind for fraud trend dashboards.
- **Authentication:** Integrate with the existing FastAPI gateway (JWT or session cookies) through API routes in Next.js (`/app/api`).
- **Testing:** Vitest + @testing-library/react for unit tests, Playwright for E2E smoke flows, Storybook for design-system review.

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
- Keeps the Python-centric `proto/` clean; Node dependencies (hundreds of MB) do not appear in the backend virtualenv or Docker images.
- Allows independent CI/CD pipelines (e.g., Vercel build previews) without coupling to backend test failures.
- Still colocated at the workspace root (`/i4g/ui`) for coordinated infrastructure and shared assets (fonts, logos).

## Deployment
- **Build:** `pnpm install && pnpm turbo build` produces `.next` artifact for `apps/web`.
- **Container:** Multi-stage Dockerfile (`node:20-alpine` builder → `node:20-alpine` runner). Copy only `.next`, `public`, and `package.json` to minimize size.
- **Hosting:** Cloud Run (fully managed) or Vercel. Cloud Run is preferred for parity with backend deployment; container exposes port 8080.
- **CI:** GitHub Actions pipeline triggered on PRs. Steps: lint, unit tests, Playwright smoke (against ephemeral deploy), build & push image to Artifact Registry.

## Navigation & Layout
Top-level navigation uses a responsive side rail (collapsible on mobile) with tabs for:
1. **Dashboard** – Alerts, intake volume, case backlog, quick actions.
2. **Search** – Structured filters, saved searches, paginated results with summary cards and inline actions.
3. **Cases & Tasks** – Kanban/table views, assignment workflows.
4. **Taxonomy** – Manage fraud types, variant metadata.
5. **Analytics** – Trend charts, segmentation by taxonomy, competition leaderboards (future).

Each page includes a floating help icon linking to the relevant doc (`docs/book/guides/...`). The icon can be swapped for branded assets later.

### Layout Guidelines
- Use responsive grid with consistent spacing (8px base).
- Provide context sections (e.g., filter drawer, result cards) with subtle elevation to guide focus.
- Keep secondary actions tucked into dropdown menus or contextual toolbars to avoid overwhelming analysts.
- Highlight actionable items with vibrant accent buttons (e.g., gradient backgrounds) while keeping text high-contrast for accessibility.

## Internationalisation
- Default locale: `en`. Store translations under `apps/web/locales/<lang>/<namespace>.json`.
- Wrap UI in `app/[locale]/layout.tsx` to support locale-aware routing (`/en/search`, `/es/search`).
- Use `next-i18next` for server/client translation hooks. Ensure formatting utilities (numbers, dates) use `Intl` APIs for locale correctness.

## Mobile Strategy
- Build UI primitives (buttons, cards, typography) in `packages/ui-kit` with platform-agnostic props.
- Share design tokens with a React Native (Expo) app by exporting Tailwind-compatible tokens and a React Native counterpart (via NativeWind or Shopifiy Restyle).
- Keep business logic (e.g., filter configuration, case actions) in `packages/sdk` so both web and mobile call the same typed helpers.

## Brand Integration
- Import color palette and fonts from assets in `../dtp/Logos` (initial analysis shows deep blue and vibrant teal gradients). Create Tailwind token definitions for primary/secondary colors, typography, and iconography.
- Use Heroicons or Phosphor icons temporarily; replace with custom SVGs when branding assets are finalised.

## Next Steps Checklist
- [ ] Derive design tokens (colors, typography) from existing logos.
- [ ] Generate `turbo.json`, `tsconfig.base.json`, `.eslintrc.cjs` in `packages/config`.
- [ ] Scaffold `apps/web` via `create-next-app` with App Router + Tailwind + ESLint + src directory.
- [ ] Create `packages/ui-kit` with Tailwind setup, Radix primitives, Storybook config.
- [ ] Implement authentication handshake with FastAPI (`/api/auth/session`).
- [ ] Build Dashboard/Search/Cases skeleton pages with placeholder data.
- [ ] Add `?` help buttons linking to doc placeholders.
- [ ] Configure GitHub Actions pipeline (lint/test/build) and publish Docker image to Artifact Registry.

This document should evolve as UX research or product requirements expand (competitions, analytics, etc.).
