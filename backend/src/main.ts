import "reflect-metadata";

import { existsSync } from "node:fs";
import { join } from "node:path";

import { NestFactory } from "@nestjs/core";
import type { NestExpressApplication } from "@nestjs/platform-express";

import { AppModule } from "./app.module";

async function bootstrap() {
  // Local settings such as DATABASE_URL. The file is ignored by Git.
  const env = join(__dirname, "..", ".env");
  if (existsSync(env)) process.loadEnvFile(env);

  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useBodyParser("raw", { type: "application/pdf", limit: "2mb" }); // CV uploads
  app.enableCors({ origin: "http://localhost:5173" });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}

void bootstrap();
