import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import {
  normalizeApifyItem,
  ApifyRawItem,
} from "./utils/apify-parser.util";

type TamanhoEmpresa = "10_ate_20" | "21_ate_50" | "51_ate_100";

function mapTamanhoEmpresa(
  employees?: number | null
): TamanhoEmpresa | null {
  if (!employees) return null;
  if (employees >= 10 && employees <= 20) return "10_ate_20";
  if (employees >= 21 && employees <= 50) return "21_ate_50";
  if (employees >= 51 && employees <= 100) return "51_ate_100";
  return null;
}

@Injectable()
export class ApifyImportService {
  constructor(private readonly supabase: SupabaseService) {}

  async importByUrl(url: string) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Falha ao buscar dataset da Apify");
    }

    const items = (await response.json()) as ApifyRawItem[];

    let imported = 0;
    let skipped = 0;
    let createdCompanies = 0;
    let skippedDuplicateLeads = 0;

    for (const item of items) {
      let normalized;
      try {
        normalized = normalizeApifyItem(item);
      } catch {
        skipped++;
        continue;
      }

      const { empresa, lead } = normalized;

      /* ======================================================
         EMPRESA — DUPLICIDADE POR LINKEDIN
      ====================================================== */
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
        const tamanhoEnum = mapTamanhoEmpresa(
          empresa.tamanho_funcionarios
        );

        const { data, error } = await this.supabase.db
          .from("empresas")
          .insert({
            nome: empresa.nome,
            site: empresa.site,
            linkedin_url: empresa.linkedin_url,
            industria: empresa.industria,
            cidade: empresa.cidade,
            estado: empresa.estado,
            pais: empresa.pais,
            tamanho: tamanhoEnum,
            tamanho_funcionarios: empresa.tamanho_funcionarios,
          })
          .select("id")
          .single();

        if (error || !data) {
          skipped++;
          continue;
        }

        empresaId = data.id;
        createdCompanies++;
      }

      /* ======================================================
         LEAD — DUPLICIDADE POR LINKEDIN
      ====================================================== */
      const { data: leadExistente } = await this.supabase.db
        .from("leads")
        .select("id")
        .eq("linkedin_url", lead.linkedin_url)
        .maybeSingle();

      if (leadExistente) {
        skippedDuplicateLeads++;
        skipped++;
        continue;
      }

      const { error: leadError } = await this.supabase.db
        .from("leads")
        .insert({
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

      if (leadError) {
        skipped++;
        continue;
      }

      imported++;
    }

    return {
      ok: true,
      total: items.length,
      imported,
      skipped,
      details: {
        createdCompanies,
        skippedDuplicateLeads,
      },
    };
  }
}
