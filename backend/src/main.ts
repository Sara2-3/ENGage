import "reflect-metadata";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("raw", { type: "application/pdf", limit: "2mb" }); // CV uploads
  app.enableCors({ origin: "http://localhost:5173" });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
