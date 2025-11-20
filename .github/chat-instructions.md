---
applyTo: "**/*.ts,**/*.tsx"
---
# UI (Next.js) TypeScript & React Coding Standards

Apply the shared general coding guidelines in `../proto/.github/general-coding.instructions.md` for cross-repo norms.

## TypeScript Guidelines (UI-specific)
- Use TypeScript for all new code in `apps/web/` and adjacent packages.
- Prefer small, pure utility functions in `apps/web/src/lib/` and `apps/web/src/utils/`.
- Mirror FastAPI payload shapes (review/search) in frontend types. Keep DTOs in `apps/web/src/types/` and reuse across components.
- Prefer `readonly` and `const` for immutable values; use discriminated unions for state machines (e.g. review item status).

## React Guidelines (UI-specific)
- Use functional components with hooks; place shared hooks in `apps/web/src/hooks/`.
- Keep components focused; when state/logic grows, extract to hooks or small utility modules.
- Prefer CSS modules or the shared `@i4g/ui-kit` tokens; avoid large inline code blocks in docs—link to files instead.

## Build & Tooling reminders
- UI uses Node.js + PNPM workspaces; run `pnpm install` at repo root, then `pnpm --filter web dev` for local dev.
- Respect `NEXT_PUBLIC_*` vs server-only env-var scoping; server-only values must not be exposed to the client.

## Docs+Snippets (UI)
- When documenting Docker or build files (e.g. `ui/docker/ui-console.Dockerfile`), avoid copying the entire file into a doc; instead include a short, focused snippet and link to the file path in the repo.
- Keep code examples minimal and focused on the relevant change — readers can open the full file from the repo link.
