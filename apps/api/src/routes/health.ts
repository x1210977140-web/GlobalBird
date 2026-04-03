import type { HealthDto } from "@global-bird/contracts";
import type { FastifyInstance } from "fastify";
import { env } from "../app/env";

export function registerHealthRoute(app: FastifyInstance) {
  app.get("/api/v1/health", async (): Promise<HealthDto> => {
    return {
      status: "ok",
      appName: env.appName,
    };
  });
}
