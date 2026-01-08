// src/hasdata/dto/import-by-url.dto.ts
import { IsUrl } from "class-validator";

export class ImportHasdataByUrlDto {
  @IsUrl({}, { message: "URL do HasData inválida" })
  url!: string;
}
