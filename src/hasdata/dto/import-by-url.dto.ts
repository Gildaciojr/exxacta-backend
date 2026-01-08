import {
  IsOptional,
  IsUrl,
  IsBoolean,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

/* =========================================
   DTO PARA AS OPÇÕES
========================================= */
export class ImportHasdataOptionsDto {
  @IsOptional()
  @IsBoolean()
  allowMissingEmployees?: boolean;

  @IsOptional()
  @IsBoolean()
  requireEmployees?: boolean;
}

/* =========================================
   DTO PRINCIPAL
========================================= */
export class ImportHasdataByUrlDto {
  @IsUrl({}, { message: "URL do HasData inválida" })
  url!: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ImportHasdataOptionsDto)
  options?: ImportHasdataOptionsDto;
}
