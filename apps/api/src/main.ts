import { healthRoute } from "./routes/health";

function bootstrap() {
  console.log("API skeleton ready");
  console.log(`Registered route: ${healthRoute.method} ${healthRoute.url}`);
}

bootstrap();

