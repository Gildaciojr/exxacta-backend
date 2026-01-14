import { Injectable, NotFoundException } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";

export type EmailEtapa = "day01" | "day03" | "day07";

@Injectable()
export class EmailTemplatesService {
  constructor(
    private readonly supabase: SupabaseService
  ) {}

  async getTemplateByEtapa(etapa: EmailEtapa) {
    const { data, error } = await this.supabase.db
      .from("email_templates")
      .select("*")
      .eq("etapa", etapa)
      .eq("ativo", true)
      .single();

    if (error || !data) {
      throw new NotFoundException(
        `Template de email não encontrado para a etapa ${etapa}`
      );
    }

    return data;
  }

  renderTemplate(
    template: string,
    vars: Record<string, string>
  ): string {
    let output = template;

    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "gi");
      output = output.replace(regex, value ?? "");
    }

    return output;
  }
}
