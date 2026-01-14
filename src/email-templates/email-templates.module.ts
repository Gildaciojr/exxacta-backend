import { Module } from "@nestjs/common";
import { EmailTemplatesService } from "./email-templates.service";
import { EmailTemplatesController } from "./email-templates.controller";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  controllers: [EmailTemplatesController],
  providers: [EmailTemplatesService, SupabaseService],
  exports: [EmailTemplatesService],
})
export class EmailTemplatesModule {}
