import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { HasdataImportService } from "./hasdata-import.service";
import { ImportHasdataByUrlDto } from "./dto/import-by-url.dto";

@Controller("/api/hasdata")
export class HasdataController {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly importService: HasdataImportService
  ) {}

  // =========================================================
  // IMPORTAÇÃO DIRETA (URL DO HASDATA) ✅ NOVO
  // =========================================================
  @Post("/import-by-url")
  async importByUrl(@Body() body: ImportHasdataByUrlDto) {
    return this.importService.importByUrl(body.url);
  }

  // =========================================================
  // IMPORTAÇÃO LEGADA (n8n / POST DIRETO) ✅ MANTIDA
  // =========================================================
  @Post("/import")
  async import(@Body() body: any) {
    const { nome, telefone, site, status } = body;

    if (!nome) {
      return { error: "Nome é obrigatório" };
    }

    const { data: existente } = await this.supabase.db
      .from("leads")
      .select("id")
      .eq("nome", nome)
      .eq("telefone", telefone ?? "")
      .maybeSingle();

    if (existente) {
      return { skipped: true, reason: "Lead já existe" };
    }

    const { data, error } = await this.supabase.db
      .from("leads")
      .insert({
        nome,
        telefone: telefone ?? null,
        linkedin_url: site ?? null,
        perfil: "outro",
        status: status ?? "novo",
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro HasData import:", error);
      return { error: "Database error" };
    }

    return { ok: true, lead: data };
  }
}
