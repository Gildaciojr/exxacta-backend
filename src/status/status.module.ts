import { Module } from "@nestjs/common";
import { StatusController } from "./status.controller";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  controllers: [StatusController],
  providers: [SupabaseService],
})
export class StatusModule {}
