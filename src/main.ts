// src/main.ts
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";
import { validateEnv } from "./config/env.validation";

async function bootstrap() {
  dotenv.config();
  validateEnv();

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      "https://exxacta-dashboard-prod.vercel.app",
      "https://exxacta.app.com.br",
    ],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "x-exxacta-signature"],
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`🚀 Exxacta Backend rodando na porta ${port}`);
}

bootstrap();
