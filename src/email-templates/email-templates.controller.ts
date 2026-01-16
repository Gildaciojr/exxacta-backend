import {
  Controller,
  Get,
  Query,
  BadRequestException,
} from "@nestjs/common";
import { EmailTemplatesService } from "./email-templates.service";

@Controller("email-templates")
export class EmailTemplatesController {
  constructor(
    private readonly service: EmailTemplatesService
  ) {}

  @Get("render")
  async render(
    @Query("etapa") etapa: "day01" | "day03" | "day07",
    @Query("nome") nome: string,
    @Query("empresa") empresa: string,
    @Query("remetente") remetente: string
  ) {
    if (!etapa) {
      throw new BadRequestException("Etapa é obrigatória");
    }

    const template = await this.service.getTemplateByEtapa(etapa);

    return {
      assunto: this.service.renderTemplate(template.assunto, {
        nome,
        empresa,
        remetente,
      }),
      corpo: this.service.renderTemplate(template.corpo, {
        nome,
        empresa,
        remetente,
      }),
    };
  }
}
