import { IsOptional, IsUrl, IsBoolean } from "class-validator";

export class ImportApifyByUrlDto {
  @IsUrl({}, { message: "URL da Apify inválida" })
  url!: string;

  /**
   * true: importa TUDO (inclusive fora do filtro 10–150)
   * false/undefined: só importa o que respeita 10–150
   *
   * compatibilidade com o front atual 
   */
  @IsOptional()
  @IsBoolean({ message: "forceImport deve ser boolean" })
  forceImport?: boolean;
}
