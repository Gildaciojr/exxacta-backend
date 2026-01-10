import { IsOptional, IsUrl, IsBoolean } from "class-validator";

export class ImportApifyByUrlDto {
  @IsUrl({}, { message: "URL da Apify inválida" })
  url!: string;

  /**
   * ✅ Quando true: importa TUDO (inclusive fora do filtro 10–150)
   * ✅ Quando false/undefined: só importa o que respeita 10–150
   *
   * Mantém compatibilidade com o front atual (se ele não mandar nada, default = false)
   */
  @IsOptional()
  @IsBoolean({ message: "forceImport deve ser boolean" })
  forceImport?: boolean;
}
