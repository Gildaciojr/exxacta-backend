import { Module } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { LeadCreatedController } from "./lead-created.controller";
import { LeadFollowupController } from "./lead-followup.controller";
import { LeadRespondedController } from "./lead-responded.controller";
import { LeadLostController } from "./lead-lost.controller";
import { LeadNegociationController } from "./lead-negociation.controller";

@Module({
  controllers: [
    LeadCreatedController,
    LeadFollowupController,
    LeadRespondedController,
    LeadLostController,
    LeadNegociationController,
  ],
  providers: [SupabaseService],
})
export class WebhooksModule {}
