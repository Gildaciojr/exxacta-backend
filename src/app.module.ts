import { Module, MiddlewareConsumer } from "@nestjs/common";
import { AppController } from "./app.controller";

import { WebhooksModule } from "./webhooks/webhooks.module";
import { HasdataModule } from "./hasdata/hasdata.module";
import { StatusModule } from "./status/status.module";
import { ApifyModule } from "./apify/apify.module";

import { SupabaseService } from "./supabase/supabase.service";

import { ValidateN8nSignatureMiddleware } from "./common/middleware/validate-n8n-signature.middleware";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";

import { EmailTemplatesModule } from "./email-templates/email-templates.module";
import { LeadsModule } from "./leads/leads.module";

@Module({
  imports: [
    WebhooksModule,
    HasdataModule,
    StatusModule,
    ApifyModule,
    EmailTemplatesModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(
        RequestLoggerMiddleware,           // 👈 PRIMEIRO: LOGA TUDO
        ValidateN8nSignatureMiddleware     // 👈 DEPOIS: VALIDA ASSINATURA
      )
      .forRoutes(
        "/api/webhooks",
        "/api/status",
        "/api/apify" // 🔥 MUITO IMPORTANTE: LOGAR IMPORTAÇÃO
      );
  }
}
