import { Module } from "@nestjs/common";
import { ApifyController } from "./apify.controller";
import { ApifyImportService } from "./apify-import.service";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  controllers: [ApifyController],
  providers: [ApifyImportService, SupabaseService],
})
export class ApifyModule {}
