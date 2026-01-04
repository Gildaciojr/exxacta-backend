import { Module } from "@nestjs/common";
import { HasdataController } from "./hasdata.controller";
import { SupabaseService } from "../supabase/supabase.service";

@Module({
  controllers: [HasdataController],
  providers: [SupabaseService],
})
export class HasdataModule {}
