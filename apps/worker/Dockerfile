FROM node:24-bookworm-slim

WORKDIR /app

RUN corepack enable

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install --frozen-lockfile

COPY apps/worker apps/worker

CMD ["pnpm", "--filter", "@global-bird/worker", "start"]
