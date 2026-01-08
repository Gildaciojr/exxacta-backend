import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { fetchAndParseHasdata } from "./utils/hasdata-parser.util";

@Injectable()
export class HasdataImportService {
  constructor(private readonly supabase: SupabaseService) {}

  async importByUrl(url: string) {
    const items = await fetchAndParseHasdata(url);

    let imported = 0;
    let skipped = 0;

    for (const item of items) {
      if (!item.company_name) {
        skipped++;
        continue;
      }

      if (item.employees && (item.employees < 10 || item.employees > 150)) {
        skipped++;
        continue;
      }

      // =====================================================
      // EMPRESA
      // =====================================================
      const { data: empresaExistente } = await this.supabase.db
        .from("empresas")
        .select("id")
        .eq("nome", item.company_name)
        .maybeSingle();

      let empresaId = empresaExistente?.id;

      if (!empresaId) {
        const { data: empresaNova, error } = await this.supabase.db
          .from("empresas")
          .insert({
            nome: item.company_name,
            site: item.website ?? null,
            cidade: item.city ?? null,
            estado: item.state ?? null,
            pais: item.country ?? "Brasil",
            linkedin_url: item.linkedin ?? null,
            tamanho: "10_ate_50",
          })
          .select("id")
          .single();

        if (error || !empresaNova) {
          console.error("Erro ao criar empresa:", error);
          skipped++;
          continue;
        }

        empresaId = empresaNova.id;
      }

      // =====================================================
      // LEAD (EVITA DUPLICAÇÃO)
      // =====================================================
      const { data: leadExistente } = await this.supabase.db
        .from("leads")
        .select("id")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (leadExistente) {
        skipped++;
        continue;
      }

      await this.supabase.db.from("leads").insert({
        nome: item.owner_name || item.company_name,
        linkedin_url: item.owner_linkedin || item.linkedin || null,
        email: null,
        telefone: item.phone ?? null,
        perfil: "decisor",
        empresa_id: empresaId,
        status: "novo",
      });

      imported++;
    }

    return {
      ok: true,
      imported,
      skipped,
      total: items.length,
    };
  }
}
