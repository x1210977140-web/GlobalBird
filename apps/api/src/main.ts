import { buildApp } from "./app/build-app";
import { env } from "./app/env";

async function bootstrap() {
  const app = buildApp();

  try {
    await app.listen({
      host: env.host,
      port: env.port,
    });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

void bootstrap();
