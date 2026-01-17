// src/leads/leads.module.ts
import { Module } from "@nestjs/common";
import { LeadsController } from "./leads.controller";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  controllers: [LeadsController],
  providers: [SupabaseService],
})
export class LeadsModule {}
