import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";

@Controller("/api/hasdata/import")
export class HasdataController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async import(@Body() body: any) {
    const {
      nome,
      telefone,
      endereco,
      site,
      origem,
      status,
    } = body;

    if (!nome) {
      return { error: "Nome é obrigatório" };
    }

    // Evita duplicação por nome + telefone
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
        linkedin_url: site ?? "",
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
