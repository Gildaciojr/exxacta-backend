import { IsUrl } from "class-validator";

export class ImportApifyByUrlDto {
  @IsUrl({}, { message: "URL da Apify inválida" })
  url!: string;
}
