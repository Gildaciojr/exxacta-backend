// src/apify/apify-import.service.ts

import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { parseApifyItem, ApifyRawItem } from "./utils/apify-parser.util";

type TamanhoEmpresa = "10_ate_20" | "21_ate_50" | "51_ate_100";

function mapTamanhoEmpresa(employees?: number | null): TamanhoEmpresa | null {
  if (employees === null || employees === undefined) return null;
  if (Number.isNaN(employees)) return null;

  if (employees >= 10 && employees <= 20) return "10_ate_20";
  if (employees >= 21 && employees <= 50) return "21_ate_50";
  if (employees >= 51 && employees <= 100) return "51_ate_100";

  return null;
}

type ImportMode = "only_valid" | "force_all";

type OutOfFilterItem = {
  reason:
    | "missing_employees"
    | "below_min"
    | "above_max";
  employees: number | null;
  empresa_nome: string;
  empresa_linkedin_url: string | null;
  lead_nome: string;
  lead_linkedin_url: string;
};

function isEmployeesWithinRange(employees: number): boolean {
  return employees >= 10 && employees <= 150;
}

function classifyEmployees(employees: number | null): OutOfFilterItem["reason"] {
  if (employees === null) return "missing_employees";
  if (employees < 10) return "below_min";
  return "above_max"; // > 150
}

@Injectable()
export class ApifyImportService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * ✅ Regras:
   * - Importa SOMENTE empresas 10–150 por padrão
   * - Se dataset contiver fora do filtro => retorna "needsConfirmation" com resumo
   * - Se forceImport=true => importa tudo (inclusive fora do filtro)
   */
  async importByUrl(url: string, forceImport?: boolean) {
    const response = await fetch(url, { method: "GET" });

    if (!response.ok) {
      throw new Error("Falha ao buscar dataset da Apify");
    }

    const items = (await response.json()) as ApifyRawItem[];

    const mode: ImportMode = forceImport ? "force_all" : "only_valid";

    // contadores
    let imported = 0;
    let skipped = 0;
    let createdCompanies = 0;
    let skippedDuplicateLeads = 0;
    let skippedMissingEmail = 0;
    let skippedOutOfFilter = 0;

    // auditoria do filtro
    const outOfFilter: OutOfFilterItem[] = [];
    let validByFilterCount = 0;

    // 1) Primeiro passamos e detectamos fora do filtro
    //    (pra avisar ANTES de importar, quando mode=only_valid)
    for (const item of items) {
      const normalized = parseApifyItem(item);
      if (!normalized) continue;

      const employees = normalized.empresa.tamanho_funcionarios;

      const within =
        typeof employees === "number" && isEmployeesWithinRange(employees);

      if (within) {
        validByFilterCount++;
        continue;
      }

      outOfFilter.push({
        reason: classifyEmployees(
          typeof employees === "number" ? employees : null
        ),
        employees: typeof employees === "number" ? employees : null,
        empresa_nome: normalized.empresa.nome,
        empresa_linkedin_url: normalized.empresa.linkedin_url,
        lead_nome: normalized.lead.nome,
        lead_linkedin_url: normalized.lead.linkedin_url,
      });
    }

    // ✅ Se tem fora do filtro e não está forçando, devolve aviso para o dashboard
    // (front vai perguntar: importar só válidas ou tudo)
    if (mode === "only_valid" && outOfFilter.length > 0) {
      return {
        ok: false,
        needsConfirmation: true,
        message:
          "O dataset contém empresas fora do filtro (10 a 150 funcionários). Confirme se deseja importar apenas as válidas ou importar tudo.",
        total: items.length,
        valid_by_filter: validByFilterCount,
        out_of_filter: outOfFilter.length,
        out_of_filter_sample: outOfFilter.slice(0, 25), // amostra para UI
      };
    }

    // 2) Importação de fato
    for (const item of items) {
      const normalized = parseApifyItem(item);

      if (!normalized) {
        skipped++;
        continue;
      }

      const { empresa, lead } = normalized;

      // 🔴 REGRA DE NEGÓCIO CRÍTICA
      // n8n só funciona com email
      if (!lead.email) {
        skipped++;
        skippedMissingEmail++;
        continue;
      }

      // ✅ Filtro 10–150 (somente quando não forçamos)
      const employees = empresa.tamanho_funcionarios;
      const within =
        typeof employees === "number" && isEmployeesWithinRange(employees);

      if (mode === "only_valid" && !within) {
        skipped++;
        skippedOutOfFilter++;
        continue;
      }

      /* ======================================================
         EMPRESA — DUPLICIDADE (LinkedIn → Nome)
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
        const { data } = await this.supabase.db
          .from("empresas")
          .select("id")
          .eq("nome", empresa.nome)
          .maybeSingle();

        empresaId = data?.id ?? null;
      }

      if (!empresaId) {
        // mantém seu enum original (10–100) + grava também tamanho_funcionarios real
        // (para 101–150, tamanhoEnum = null e tamanho_funcionarios fica correto)
        const tamanhoEnum = mapTamanhoEmpresa(empresa.tamanho_funcionarios);

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
        skipped++;
        skippedDuplicateLeads++;
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
      mode,
      details: {
        createdCompanies,
        skippedDuplicateLeads,
        skippedMissingEmail,
        skippedOutOfFilter,
      },
    };
  }
}
