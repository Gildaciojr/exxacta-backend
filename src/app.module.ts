import { Module, MiddlewareConsumer, RequestMethod } from "@nestjs/common";
import { AppController } from "./app.controller";
import { SupabaseService } from "./supabase/supabase.service";
import { ValidateN8nSignatureMiddleware } from "./common/middleware/validate-n8n-signature.middleware";

@Module({
  controllers: [AppController],
  providers: [SupabaseService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ValidateN8nSignatureMiddleware)
      .forRoutes({
        path: "api/webhooks/(.*)",
        method: RequestMethod.ALL,
      });
  }
}
