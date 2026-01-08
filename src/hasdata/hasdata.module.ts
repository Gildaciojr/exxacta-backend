import { Module } from "@nestjs/common";
import { HasdataController } from "./hasdata.controller";
import { SupabaseService } from "../supabase/supabase.service";
import { HasdataImportService } from "./hasdata-import.service";

@Module({
  controllers: [HasdataController],
  providers: [SupabaseService, HasdataImportService],
})
export class HasdataModule {}
