import { Module, MiddlewareConsumer } from "@nestjs/common";
import { AppController } from "./app.controller";

import { WebhooksModule } from "./webhooks/webhooks.module";
import { HasdataModule } from "./hasdata/hasdata.module";
import { StatusModule } from "./status/status.module";
import { ApifyModule } from "./apify/apify.module";

import { SupabaseService } from "./supabase/supabase.service";
import { ValidateN8nSignatureMiddleware } from "./common/middleware/validate-n8n-signature.middleware";

@Module({
  imports: [
    WebhooksModule,
    HasdataModule,
    StatusModule,
    ApifyModule,
  ],
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateN8nSignatureMiddleware)
      .forRoutes(
        "/api/webhooks",
        "/api/status"
      );
  }
}
