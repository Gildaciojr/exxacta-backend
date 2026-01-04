"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/main.ts
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const dotenv = require("dotenv");
const env_validation_1 = require("./config/env.validation");
async function bootstrap() {
    dotenv.config();
    (0, env_validation_1.validateEnv)();
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
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
