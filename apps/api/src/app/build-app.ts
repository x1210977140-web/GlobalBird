import Fastify from "fastify";
import { registerApiRoutes } from "../routes/api-v1";
import { registerHealthRoute } from "../routes/health";

export function buildApp() {
  const app = Fastify({
    logger: true,
  });

  registerHealthRoute(app);
  registerApiRoutes(app);

  return app;
}
