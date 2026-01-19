import { Injectable } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { fetchAndParseHasdata } from "./utils/hasdata-parser.util";

/* =====================================================
   MAPEAMENTO DO ENUM tamanho_empresa (POSTGRES)
===================================================== */
type TamanhoEmpresa = "10_ate_20" | "21_ate_50" | "51_ate_100";

function mapTamanhoEmpresa(employees?: number | null): TamanhoEmpresa | null {
  if (employees === null || employees === undefined) return null;

  // garante número válido
  if (Number.isNaN(employees)) return null;

  if (employees >= 10 && employees <= 20) return "10_ate_20";
  if (employees >= 21 && employees <= 50) return "21_ate_50";
  if (employees >= 51 && employees <= 100) return "51_ate_100";

  return null;
}

type ImportByUrlOptions = {
  /**
   * true  => importa também itens SEM employees (tamanho fica null)
   * false => apenas segue a regra padrão
   */
  allowMissingEmployees?: boolean;

  /**
   * true  => importa SOMENTE itens COM employees (e dentro do range 10-100)
   * false => apenas segue a regra padrão
   */
  requireEmployees?: boolean;
};

@Injectable()
export class HasdataImportService {
  constructor(private readonly supabase: SupabaseService) {}

  /**
   * Fluxo:
   * - Se existir item sem "employees" e NÃO vier options, retorna needsConfirmation
   * - Se options.allowMissingEmployees = true => importa tudo (tamanho null quando faltar)
   * - Se options.requireEmployees = true => importa somente os que tiverem employees (10..100)
   */
  async importByUrl(url: string, options?: ImportByUrlOptions) {
    const items = await fetchAndParseHasdata(url);

    // conta itens sem employees
    const missingEmployeesCount = items.reduce((acc: number, item: any) => {
      const employees = item?.employees;
      if (employees === null || employees === undefined) return acc + 1;
      return acc;
    }, 0);

    // Se há itens sem employees e o caller ainda não decidiu o que fazer
    const hasDecision =
      options?.allowMissingEmployees === true || options?.requireEmployees === true;

    if (missingEmployeesCount > 0 && !hasDecision) {
      return {
        ok: true,
        needsConfirmation: true,
        message:
          "Algumas empresas não possuem a informação 'Quantidade de funcionários'. Deseja continuar a importação mesmo assim?",
        total: items.length,
        missingEmployees: missingEmployeesCount,
      };
    }

    let imported = 0;
    let skipped = 0;

    // métricas úteis 
    let skippedMissingCompanyName = 0;
    let skippedOutOfRangeEmployees = 0;
    let skippedMissingEmployeesBecauseRequire = 0;
    let skippedNoValidEnumButHadEmployees = 0;
    let skippedCompanyInsertError = 0;
    let skippedLeadAlreadyExists = 0;
    let createdCompanies = 0;

    for (const item of items) {
      /* -----------------------------------------------------
         NORMALIZAÇÃO DO INPUT 
      ----------------------------------------------------- */
      const companyName: string | null = item?.company_name ?? null;
      const website: string | null = item?.website ?? null;
      const city: string | null = item?.city ?? null;
      const state: string | null = item?.state ?? null;
      const country: string | null = item?.country ?? null;
      const linkedin: string | null = item?.linkedin ?? null;

      const ownerName: string | null = item?.owner_name ?? null;
      const ownerLinkedin: string | null = item?.owner_linkedin ?? null;
      const phone: string | null = item?.phone ?? null;

      // employees pode vir string/number/null
      const employeesRaw = item?.employees;
      const employees =
        employeesRaw === null || employeesRaw === undefined
          ? null
          : typeof employeesRaw === "number"
            ? employeesRaw
            : typeof employeesRaw === "string"
              ? Number(employeesRaw)
              : null;

      /* -----------------------------------------------------
         VALIDAÇÕES BÁSICAS
      ----------------------------------------------------- */
      if (!companyName || !companyName.trim()) {
        skipped++;
        skippedMissingCompanyName++;
        continue;
      }

      if (options?.requireEmployees === true && (employees === null || employees === undefined)) {
        skipped++;
        skippedMissingEmployeesBecauseRequire++;
        continue;
      }

      // Se employees existe, aplica filtro 10..100
      if (employees !== null && employees !== undefined) {
        if (Number.isNaN(employees) || employees < 10 || employees > 100) {
          skipped++;
          skippedOutOfRangeEmployees++;
          continue;
        }
      }

      // Mapeia enum apenas quando employees existe
      const tamanhoEmpresa = mapTamanhoEmpresa(employees);

      // Se employees existe mas não encaixa no enum, descarta
      if (employees !== null && employees !== undefined && !tamanhoEmpresa) {
        skipped++;
        skippedNoValidEnumButHadEmployees++;
        continue;
      }

      /* -----------------------------------------------------
         EMPRESA 
      ----------------------------------------------------- */
      const { data: empresaExistente } = await this.supabase.db
        .from("empresas")
        .select("id")
        .eq("nome", companyName)
        .maybeSingle();

      let empresaId = empresaExistente?.id;

      if (!empresaId) {
        
      
        const empresaPayload: Record<string, any> = {
          nome: companyName,
          site: website,
          cidade: city,
          estado: state,
          pais: country ?? "Brasil",
          linkedin_url: linkedin,
        };

        if (tamanhoEmpresa) {
          empresaPayload.tamanho = tamanhoEmpresa;
        } else {
          
          if (options?.allowMissingEmployees === true) {
          
          } else {
           
            skipped++;
            skippedNoValidEnumButHadEmployees++;
            continue;
          }
        }

        const { data: empresaNova, error } = await this.supabase.db
          .from("empresas")
          .insert(empresaPayload)
          .select("id")
          .single();

        if (error || !empresaNova) {
          console.error("Erro ao criar empresa:", error);
          skipped++;
          skippedCompanyInsertError++;
          continue;
        }

        empresaId = empresaNova.id;
        createdCompanies++;
      }

      /* -----------------------------------------------------
         LEAD
      ----------------------------------------------------- */
      const { data: leadExistente } = await this.supabase.db
        .from("leads")
        .select("id")
        .eq("empresa_id", empresaId)
        .maybeSingle();

      if (leadExistente) {
        skipped++;
        skippedLeadAlreadyExists++;
        continue;
      }

      const { error: leadError } = await this.supabase.db.from("leads").insert({
        nome: ownerName || companyName,
        linkedin_url: ownerLinkedin || linkedin || null,
        email: null,
        telefone: phone ?? null,
        perfil: "decisor",
        empresa_id: empresaId,
        status: "novo",
      });

      if (leadError) {
        console.error("Erro ao criar lead:", leadError);
        skipped++;
        continue;
      }

      imported++;
    }

    return {
      ok: true,
      imported,
      skipped,
      total: items.length,

      warnings: {
        missingEmployeesFound: missingEmployeesCount,
      },
      details: {
        createdCompanies,
        skippedMissingCompanyName,
        skippedOutOfRangeEmployees,
        skippedMissingEmployeesBecauseRequire,
        skippedNoValidEnumButHadEmployees,
        skippedCompanyInsertError,
        skippedLeadAlreadyExists,
      },
    };
  }
}
