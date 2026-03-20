# Analyst Console — UI Architecture

_Last Updated: 2026-03-19 | Last Verified: March 2026_
_Version: 2.0_

## 1. System Scope

The `i4g-console` is the browser-based analyst workstation for the I4G Platform. It is a Next.js 15 application deployed as a separate Cloud Run service (`i4g-console`) fronted by Google IAP.

**What the console does:**

- Renders all analyst workflows: search, case intake, reviews, campaigns, intelligence, impact analytics, SSI investigations, eCX submissions, reporting
- Acts as a secure server-side proxy between the browser and the backend services (core-svc, ssi-svc)
- Surfaces the authenticated user's identity from IAP to all components via a React context

**What the console does NOT do:**

- Execute business logic — all data mutations go through core-svc or ssi-svc
- Store persistent state — no client-side database; all state lives in the backends
- Communicate with the SSI service directly for investigation lifecycle operations — those route through core-svc which is the orchestrator

---

## 2. Monorepo Structure

The `ui/` directory is a **pnpm workspace monorepo** managed by Turborepo.

```
ui/
├── apps/
│   └── web/               # Next.js 15 analyst console (i4g-console)
├── packages/
│   ├── sdk/               # @i4g/sdk — Zod-validated REST client + type models
│   ├── tokens/            # @i4g/tokens — Design tokens (colors, spacing, typography)
│   ├── types/             # @i4g/types — Shared TypeScript interfaces (no runtime code)
│   └── ui-kit/            # @i4g/ui-kit — Tailwind + Radix primitive components
├── scripts/               # workspace-level build utilities (e.g. sync-hybrid-schema.js)
├── turbo.json             # Turborepo pipeline (build → lint → test ordering)
├── pnpm-workspace.yaml    # Workspace package paths
└── tsconfig.base.json     # Shared TypeScript base config
```

### Package Responsibilities

| Package           | Name          | Purpose                                                                                                                                                  |
| ----------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/sdk`    | `@i4g/sdk`    | Typed REST client against the core-svc OpenAPI schema. Zod models validate response shapes. Provides `getI4GClient()` factory used in server components. |
| `packages/tokens` | `@i4g/tokens` | Shared design token constants (colors, typography). Exported as TypeScript objects; consumed by `tailwind.config.ts` in `apps/web`.                      |
| `packages/types`  | `@i4g/types`  | Pure TypeScript interface definitions shared across packages. No runtime code.                                                                           |
| `packages/ui-kit` | `@i4g/ui-kit` | Tailwind + Radix-based component primitives (Button, Card, Badge, etc.) used by all pages. Built with `clsx` and `class-variance-authority`.             |

### Dependency Graph

```
apps/web
  ├── @i4g/sdk       (data access)
  ├── @i4g/tokens    (design values → tailwind.config.ts)
  ├── @i4g/types     (shared interfaces)
  └── @i4g/ui-kit    (component primitives)

@i4g/ui-kit
  └── @i4g/tokens    (tokens feed component styling)

@i4g/sdk
  └── @i4g/types     (response types)
```

---

## 3. Application Structure (`apps/web/`)

```
apps/web/
├── src/
│   ├── app/
│   │   ├── (console)/         # Route group — all authenticated analyst pages
│   │   │   ├── layout.tsx     # Console shell: AuthProvider + Navigation + FeedbackShell
│   │   │   ├── navigation.tsx # Sidebar nav component
│   │   │   ├── dashboard/     # Landing page with quick actions
│   │   │   ├── cases/         # Case intake + detail views
│   │   │   ├── search/        # Intelligence search
│   │   │   ├── reviews/       # Review queue
│   │   │   ├── discovery/     # Discovery panel
│   │   │   ├── intelligence/  # Entities + campaigns + annotations
│   │   │   ├── campaigns/     # Campaign views
│   │   │   ├── impact/        # Analytics + taxonomy explorer + geography
│   │   │   ├── reports/       # Dossier reports
│   │   │   ├── ssi/           # SSI investigation console
│   │   │   └── admin/users/   # Admin user management
│   │   ├── api/               # Server-side proxy routes (see §4)
│   │   ├── layout.tsx         # Root layout (fonts, theme)
│   │   └── page.tsx           # Root redirect → /dashboard
│   ├── actions/               # Next.js Server Actions (e.g. tokenization)
│   ├── components/            # Shared UI components (text-with-tokens, command-palette, etc.)
│   ├── config/                # App-level constants
│   ├── content/               # Static content registry (help text, etc.)
│   ├── hooks/                 # Client-side React hooks
│   ├── lib/
│   │   ├── server/            # Server-only helpers (auth-helpers, api-client, ssi-proxy, user-service)
│   │   ├── auth-context.tsx   # Client AuthContext + useAuth hook
│   │   ├── i4g-client.ts      # SDK client factory used in server components
│   │   └── iap-token.ts       # Cloud Run identity token fetcher (google-auth-library)
│   └── types/                 # Page-scoped TypeScript types
└── middleware.ts              # Edge auth guard (IAP header check)
```

### Route Group: `(console)`

All analyst pages live under the `(console)` route group. The shared `layout.tsx` for this group:

1. Calls `getCurrentUser()` (server-side) to fetch role from core-svc
2. Instantiates `<AuthProvider user={user}>` — makes `useAuth()` available to all client components
3. Renders `<Navigation>` + `<FeedbackShell>` + `<CommandPalette>` as the shell

---

## 4. API Proxy Layer

All API calls from the browser go through Next.js **server-side route handlers** in `src/app/api/`. These routes run in the Node.js runtime and inject service authentication before forwarding to backend services.

### Route Map

| Next.js Route                                             | Method                    | Backend Target                     | Notes                                                                                |
| --------------------------------------------------------- | ------------------------- | ---------------------------------- | ------------------------------------------------------------------------------------ |
| `/api/[...path]`                                          | GET/POST/PUT/DELETE/PATCH | `I4G_API_URL` (core-svc)           | Catch-all proxy — handles all paths not matched by a named route                     |
| `/api/search`                                             | GET                       | core-svc                           | Convenience alias with query param normalization                                     |
| `/api/reviews/saved`, `/api/reviews/saved/[id]`           | GET/POST/PUT/DELETE       | core-svc                           | Saved-search CRUD                                                                    |
| `/api/reviews/history`                                    | GET                       | core-svc                           | Review history                                                                       |
| `/api/intakes`                                            | POST                      | core-svc                           | Case intake submission                                                               |
| `/api/discovery/search`                                   | GET                       | core-svc                           | Discovery panel search                                                               |
| `/api/dossiers/download`, `/api/dossiers/verify`          | GET                       | core-svc                           | Dossier file operations                                                              |
| `/api/feedback`                                           | POST                      | core-svc                           | Analyst feedback                                                                     |
| `/api/ssi/investigate`                                    | POST                      | **core-svc** `/investigations/ssi` | Investigation trigger — always via core (orchestrator); normalizes payload + dedup   |
| `/api/ssi/investigate/[id]`                               | GET                       | core-svc                           | Investigation status poll                                                            |
| `/api/ssi/investigations`, `/api/ssi/investigations/[id]` | GET                       | core-svc                           | Investigation list/detail                                                            |
| `/api/ssi/report/[id]`                                    | GET                       | core-svc                           | Investigation report                                                                 |
| `/api/ssi/wallets`                                        | GET                       | core-svc                           | Wallet entities linked to investigations                                             |
| `/api/events/ssi/[scanId]/stream`                         | GET (SSE)                 | core-svc `/events/ssi/{scanId}`    | Live event stream — polls core and re-emits as SSE                                   |
| `/api/events/ssi/[scanId]/guidance`                       | GET                       | core-svc                           | Investigation guidance events                                                        |
| `/api/ssi/ecx/*`                                          | GET/POST/PUT              | **ssi-svc** directly               | eCX feed, submissions, stats, approve/reject/retract — bypass core via `SSI_API_URL` |

### Key Design Rule

> **Investigation lifecycle** (trigger, poll, status) → **core-svc** (orchestrator).
> **eCX data plane** (feed, submissions, stats) → **ssi-svc** directly.

This separation means the UI always submits investigations through core, which creates the task record and handles deduplication before forwarding to the SSI Cloud Run service.

### Catch-All Proxy (`/api/[...path]`)

The catch-all proxy in `src/app/api/[...path]/route.ts`:

- Resolves the upstream URL: `I4G_API_URL` → `NEXT_PUBLIC_API_BASE_URL` → `http://127.0.0.1:8000`
- Calls `getIapHeaders()` to obtain auth headers
- Strips `Host`, `Connection`, `content-encoding`, `content-length` before forwarding
- Forwards the request body as a stream (with `duplex: "half"` for Node.js fetch)
- Propagates status codes and response body unchanged

### SSI eCX Proxy (`/api/ssi/ecx/*`)

eCX routes use a dedicated `ssi-proxy` helper (`src/lib/server/ssi-proxy.ts`):

- Resolves `SSI_API_URL` (throws if unset)
- On Cloud Run (`K_SERVICE` env present) and non-localhost target: fetches an OIDC identity token via the GCP Metadata Server, sends as `Authorization: Bearer <token>`
- On localhost: passes no auth headers

---

## 5. Authentication Flow

```
Browser
  │
  ▼
Google IAP (Load Balancer)
  │  Validates browser session cookie / IAP token
  │  Injects: X-Goog-Authenticated-User-Email, X-Goog-IAP-JWT-Assertion
  ▼
Next.js middleware (edge)
  │  Verifies X-Goog-Authenticated-User-Email header present (non-local)
  │  Rejects with 401 if missing (misconfiguration guard)
  ▼
(console)/layout.tsx  — server component
  │  Calls getCurrentUser() → apiFetch("/accounts/me")
  │  apiFetch injects: X-I4G-Forwarded-User (user email from IAP JWT payload)
  │               + Authorization: Bearer <OIDC identity token>  (when on GCP)
  ▼
AuthProvider (client component)
  │  Holds { email, role, displayName } in React context
  │  useAuth() hook exposes { user, hasRole(), isAdmin }
  ▼
All route pages & client components via useAuth()
```

### Service-to-Service Auth

When the Next.js app calls core-svc or ssi-svc from GCP Cloud Run:

1. **User identity**: Extracted from the incoming `X-Goog-IAP-JWT-Assertion` header (Google-verified at LB), decoded without re-verification (signature already validated by IAP). The `email` claim is forwarded as `X-I4G-Forwarded-User`.
2. **Service credential**: `getIapToken()` calls the GCP Metadata Server (`/computeMetadata/v1/instance/service-accounts/default/identity`) with the target service URL as audience, or falls back to `google-auth-library` ADC for local dev.
3. The resulting OIDC token is sent as `Authorization: Bearer <token>` — core-svc validates it via GCP IAP.

### Local Development

When `I4G_ENV=local` or `I4G_API_URL` contains `localhost`/`127.0.0.1`:

- Middleware bypasses all auth checks
- `getIapHeaders()` skips OIDC token fetch (no service credential needed)
- `ssiHeaders()` returns empty headers (no auth needed against local ssi-svc)

### Token Expiry

OIDC identity tokens have a 1-hour TTL. Each server-side request calls `getIapToken()` fresh — there is no persistent token cache. Short-lived tokens fetched per request avoid expiry issues under normal operation.

---

## 6. State Management

The console uses a **minimal, server-first** state model:

| Layer                    | Mechanism                                                     | Scope                                                                  |
| ------------------------ | ------------------------------------------------------------- | ---------------------------------------------------------------------- |
| User identity + role     | `AuthProvider` React context                                  | Set once per page load by `(console)/layout.tsx`; read via `useAuth()` |
| Server data              | Next.js server components fetch on render                     | Per-request; no client-side cache                                      |
| Client interaction state | Local `useState` / `useReducer` within components             | Component-local                                                        |
| Form state               | Native React controlled inputs + zod validation               | Form-local                                                             |
| Charts / data viz        | Recharts (client component); data passed as props from server | Per-render                                                             |

**No global client-side cache** (TanStack Query / Zustand) is currently in use. The server-component model makes most data-fetching patterns unnecessary at the client level.

---

## 7. Design Token System

The `@i4g/tokens` package (`packages/tokens/`) is the single source of truth for visual values in the web console.

```
packages/tokens/src/index.ts
  └── Exports: colors, typography (TypeScript constants)
        │
        ▼
apps/web/tailwind.config.ts
  └── Imports token values → extends Tailwind theme
        │
        ▼
All Tailwind utility classes in pages and @i4g/ui-kit components
```

**Relationship with `mobile/` design tokens:**
The `mobile/` repo contains a separate token pipeline (`mobile/shared/design-tokens/`) that generates Swift, Kotlin, and web outputs from `tokens/tokens.json`. The `packages/tokens/` package in `ui/` is the web-side token source — it currently maintains its own values rather than consuming the `mobile/` build artifacts. Alignment between the two is a future integration goal.

---

## 8. Build and Deployment

### Build Process

```bash
# From ui/ directory
pnpm install --frozen-lockfile          # installs all workspace packages
pnpm --filter web build                 # runs prebuild → schema:sync, then next build
```

`schema:sync` (via `scripts/sync-hybrid-schema.js`) bakes a snapshot of the OpenAPI schema from core-svc into the SDK. Run `pnpm run schema:check` in CI or pre-commit to verify the snapshot is current.

### Docker Image

Multi-stage build defined in `apps/web/Dockerfile`:

| Stage    | Base                    | Purpose                                                     |
| -------- | ----------------------- | ----------------------------------------------------------- |
| `base`   | `node:20-bullseye-slim` | pnpm setup                                                  |
| `deps`   | `base`                  | `pnpm install --frozen-lockfile` with workspace context     |
| `build`  | `deps`                  | `pnpm --filter web build` → outputs `apps/web/.next/`       |
| `runner` | `base`                  | Production image: prod deps only + built `.next/` artifacts |

The runner image exposes port **3000** and starts with `pnpm start`.

Build the image (from `ui/` directory):

```bash
scripts/build_image.sh i4g-console dev
```

### Environment Variables

| Variable                   | Required at        | Required in | Purpose                                                                          |
| -------------------------- | ------------------ | ----------- | -------------------------------------------------------------------------------- |
| `I4G_API_URL`              | Runtime            | Cloud Run   | Server-side URL for core-svc (private VPC URL). Not exposed to browser.          |
| `NEXT_PUBLIC_API_BASE_URL` | Build + Runtime    | All         | Client-accessible fallback API base URL                                          |
| `SSI_API_URL`              | Runtime            | Cloud Run   | URL for ssi-svc. Used by eCX proxy routes only. Not exposed to browser.          |
| `I4G_ENV`                  | Runtime            | All         | `local` disables auth middleware and OIDC token fetch                            |
| `I4G_API_KEY`              | Runtime            | Optional    | API key for non-IAP environments (local dev override)                            |
| `K_SERVICE`                | Runtime (injected) | Cloud Run   | Injected by Cloud Run; signals that Metadata Server is available for OIDC tokens |

**Build-time vs. runtime distinction:** Only `NEXT_PUBLIC_*` variables are baked into the client bundle at build time. All other variables (`I4G_API_URL`, `SSI_API_URL`, `I4G_ENV`, `I4G_API_KEY`) are server-side runtime variables read by route handlers and server components — they never reach the browser.

### Deployment Target

`i4g-console` runs as a Cloud Run service (`sa-app` service account). It sits behind the same Google IAP + HTTPS load balancer as `core-svc`. IAP validates the browser session; the console then makes service-to-service calls to `core-svc` and `ssi-svc` using Cloud Run OIDC identity tokens.

---

## 9. Testing

| Layer         | Tool                     | What's Covered                                               |
| ------------- | ------------------------ | ------------------------------------------------------------ |
| Unit          | Vitest + Testing Library | Proxy route handlers, utility functions, component rendering |
| Smoke         | Playwright               | Critical paths: search, intelligence, graph views            |
| Type checking | `tsc` (via `pnpm build`) | Full TypeScript validation including page props              |

Run all unit tests: `pnpm test` (from `ui/`)
Run smoke tests: `pnpm test:smoke` (requires running app)
Type-check only: `pnpm build` (fastest full type check)

---

## 10. Pre-Merge Checklist

```bash
pnpm format      # Prettier — ALWAYS run after editing any file
pnpm lint        # ESLint
pnpm build       # Type check + production build
```

All three must pass before merging. See `copilot/.github/shared/pre-merge-checklist.instructions.md` for the full review routine.

## Navigation & Layout

Top-level navigation uses a responsive side rail (collapsible on mobile) with two groups:

**Intelligence** (Sprint 2):

1. **Entity Explorer** – Browse, search, and filter threat entities (wallets, emails, phone numbers). Drill into entity detail with co-occurrence graph and activity sparkline.
2. **Indicator Registry** – Segmented indicator list with category tabs, bulk actions, confidence filters, and STIX export.
3. **Intelligence Dashboard** – Widget-based overview with entity, indicator, campaign, and platform KPI cards plus trend sparklines.
4. **Network Graph** – Interactive force-directed graph with temporal animation, Louvain clustering, infrastructure edges, and wallet cluster edges (blockchain enrichment).
5. **Campaigns** – Campaign CRUD, taxonomy rollup, referral status, member case aggregation with risk scores.
6. **Timeline** – Chronological event view with entity highlighting and date-range filtering.

**Impact** (original pages, reorganized):

4. **Dashboard** – Alerts, intake volume, case backlog, quick actions. Mobile-responsive with KPI sparkline cards and 2-column grid on small screens.
5. **Search** – Structured filters, saved searches, paginated results with summary cards and inline actions.
6. **Cases & Tasks** – Kanban/table views, assignment workflows. LEA referral tracking on case detail.
7. **Taxonomy** – Manage fraud types, variant metadata. Analytics-driven heatmap and Sankey views.
8. **Analytics** – Trend charts, segmentation by taxonomy, competition leaderboards (future).

**Reports**:

9. **Report Builder** – Template-driven dossier generation with LEA evidence dossier support.
10. **Report Library** – Browse, download, and verify generated reports.

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
- [x] Build Intelligence Hub pages (Entity Explorer, Indicator Registry, Intelligence Dashboard, Network Graph, Campaigns, Timeline).
- [x] Implement mobile-responsive Impact Dashboard with KPI sparkline cards and campaign alerts.
- [ ] Implement authentication handshake with FastAPI (`/api/auth/session`).
- [ ] Add Storybook for `@i4g/ui-kit` components.
- [ ] Wire TanStack Query (or equivalent) for shared caching once API endpoints stabilise.
- [ ] Stand up CI pipeline (lint/test/build/containerise) and deploy preview environments.

This document should evolve as UX research or product requirements expand (competitions, analytics, etc.).
