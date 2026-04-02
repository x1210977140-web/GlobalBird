# GlobalBird

Monorepo skeleton for the GlobalBird project.

## Layout

```text
apps/
  web/       # Vue + Vite + Three.js frontend
  api/       # REST API service
  worker/    # ETL and background jobs
packages/
  contracts/ # Shared DTOs, schemas, and error codes
docs/        # Documentation landing area
```

## Next Steps

1. Install dependencies with `pnpm install`.
2. Flesh out `apps/web` with Vite/Vue dependencies.
3. Flesh out `apps/api` with Fastify or NestJS.
4. Flesh out `apps/worker` with queue and ETL dependencies.
5. Move design docs into `docs/` when you want to finish the repo reorganization.

