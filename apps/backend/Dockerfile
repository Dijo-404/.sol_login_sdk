FROM node:20-alpine AS base
ENV PNPM_HOME=/pnpm PATH=/pnpm:$PATH NODE_ENV=production
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml turbo.json ./
COPY apps/backend/package.json apps/backend/
COPY packages/core/package.json packages/core/
COPY packages/circuits/package.json packages/circuits/
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --filter backend...

FROM base AS build
COPY --from=deps /app /app
COPY . .
RUN pnpm --filter backend exec prisma generate

FROM base AS runtime
ENV PORT=4000
COPY --from=build /app /app
WORKDIR /app/apps/backend

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:${PORT}/health || exit 1

CMD ["sh", "-c", "pnpm exec prisma migrate deploy && node src/index.js"]
