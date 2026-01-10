// src/apify/apify-import.service.ts

import { Injectable, Logger } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { parseApifyItem, ApifyRawItem } from "./utils/apify-parser.util";

@Injectable()
export class ApifyImportService {
  private readonly logger = new Logger("ApifyImport");

  constructor(private readonly supabase: SupabaseService) {}

  async importByUrl(url: string) {
    this.logger.log("🚀 Iniciando importação Apify");

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error("Falha ao buscar dataset da Apify");
    }

    const items = (await response.json()) as ApifyRawItem[];
    this.logger.log(`📦 Itens recebidos: ${items.length}`);

    let imported = 0;
    let skippedNoSize = 0;
    let skippedOutOfRange = 0;
    let skippedDuplicates = 0;

    for (const raw of items) {
      const { empresa, lead } = parseApifyItem(raw);

      const size = empresa.tamanho_funcionarios;

      // 🔴 ÚNICA REGRA DE FILTRO
      if (size === null) {
        skippedNoSize++;
        continue;
      }

      if (size < 10 || size > 150) {
        skippedOutOfRange++;
        continue;
      }

      // ================= EMPRESA =================
      let empresaId: string | null = null;

      if (empresa.linkedin_url) {
        const { data } = await this.supabase.db
          .from("empresas")
          .select("id")
          .eq("linkedin_url", empresa.linkedin_url)
          .maybeSingle();

        empresaId = data?.id ?? null;
      }

      if (!empresaId) {
        const { data } = await this.supabase.db
          .from("empresas")
          .insert({
            nome: empresa.nome,
            site: empresa.site,
            linkedin_url: empresa.linkedin_url,
            industria: empresa.industria,
            cidade: empresa.cidade,
            estado: empresa.estado,
            pais: empresa.pais,
            tamanho_funcionarios: size,
          })
          .select("id")
          .single();

        empresaId = data?.id ?? null;
      }

      if (!empresaId) continue;

      // ================= LEAD =================
      if (lead.linkedin_url) {
        const { data } = await this.supabase.db
          .from("leads")
          .select("id")
          .eq("linkedin_url", lead.linkedin_url)
          .maybeSingle();

        if (data) {
          skippedDuplicates++;
          continue;
        }
      }

      await this.supabase.db.from("leads").insert({
        nome: lead.nome,
        cargo: lead.cargo,
        email: lead.email,
        telefone: lead.telefone,
        linkedin_url: lead.linkedin_url,
        perfil: lead.perfil,
        origem: lead.origem,
        empresa_id: empresaId,
        status: "novo",
      });

      imported++;
    }

    this.logger.log(
      `✅ Finalizado | imported=${imported} | semTamanho=${skippedNoSize} | foraFiltro=${skippedOutOfRange} | duplicados=${skippedDuplicates}`
    );

    return {
      ok: true,
      total: items.length,
      imported,
      skipped_no_size: skippedNoSize,
      skipped_out_of_range: skippedOutOfRange,
      skipped_duplicates: skippedDuplicates,
    };
  }
}
