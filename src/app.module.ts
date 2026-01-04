import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { AppController } from "./app.controller";
import { SupabaseService } from "./supabase/supabase.service";
import { ValidateN8nSignatureMiddleware } from "./common/middleware/validate-n8n-signature.middleware";

import { WebhooksModule } from "./webhooks/webhooks.module";
import { HasdataModule } from "./hasdata/hasdata.module";
import { StatusModule } from "./status/status.module";

@Module({
  imports: [
    WebhooksModule,
    HasdataModule,
    StatusModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateN8nSignatureMiddleware)
      .forRoutes("api/webhooks");
  }
}
