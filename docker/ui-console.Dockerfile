# syntax=docker/dockerfile:1.7-labs

FROM node:20-bullseye-slim AS base
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"
RUN corepack enable
WORKDIR /app

FROM base AS deps
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY packages/ui-kit/package.json packages/ui-kit/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/tokens/package.json packages/tokens/package.json
COPY apps/web/package.json apps/web/package.json
RUN pnpm install --frozen-lockfile

FROM deps AS build
COPY . .
RUN pnpm --filter web build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=deps /pnpm /pnpm
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/ui-kit/package.json packages/ui-kit/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/tokens/package.json packages/tokens/package.json
RUN pnpm install --filter web... --prod --frozen-lockfile --ignore-scripts

COPY --from=build /app/apps/web/.next ./apps/web/.next
COPY --from=build /app/apps/web/public ./apps/web/public
COPY --from=build /app/apps/web/next.config.ts ./apps/web/next.config.ts

WORKDIR /app/apps/web
EXPOSE 3000
CMD ["pnpm", "start"]
