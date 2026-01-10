import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "./utils";
import { normalizeApifyLead } from "../common/normalizers/apify-lead.normalizer";

type LeadPayload = {
  id?: string | null;
  nome?: string | null;
  cargo?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  telefone?: string | null;
  perfil?: string | null;
  empresa_id?: string | null;
};

const PERFIS_VALIDOS = [
  "ceo",
  "diretor",
  "socio",
  "contador",
  "gerente",
  "outro",
  "decisor",
] as const;

function normalizarPerfil(perfil?: string | null): string {
  if (!perfil) return "outro";
  const p = perfil.trim().toLowerCase();
  return PERFIS_VALIDOS.includes(p as any) ? p : "outro";
}

@Controller("/api/webhooks/n8n/lead-created")
export class LeadCreatedController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async handle(@Body() body: any) {
    const isApifyPayload = !body.lead && body.nome_completo;

    const nowIso = new Date().toISOString();

    let leadData: any;
    let empresaData: any;

    if (isApifyPayload) {
      const normalized = normalizeApifyLead(body);
      leadData = normalized.lead;
      empresaData = normalized.empresa;
    } else {
      const lead = body?.lead ?? {};
      leadData = {
        nome: lead.nome ?? null,
        cargo: lead.cargo ?? null,
        email: lead.email ?? null,
        telefone: lead.telefone ?? null,
        linkedin_url: lead.linkedin_url ?? null,
        perfil: lead.perfil ?? "outro",
        origem: "hasdata",
      };
    }

    if (!leadData.nome || !leadData.linkedin_url) {
      return { error: "Campos obrigatórios ausentes (nome, linkedin_url)" };
    }

    // =========================
    // EMPRESA
    // =========================
    let empresaId: string | null = null;

    if (empresaData?.nome) {
      const { data: existente } = await this.supabase.db
        .from("empresas")
        .select("id")
        .eq("nome", empresaData.nome)
        .maybeSingle();

      if (existente) {
        empresaId = existente.id;
      } else {
        const { data: novaEmpresa } = await this.supabase.db
          .from("empresas")
          .insert(empresaData)
          .select("id")
          .single();

        empresaId = novaEmpresa?.id ?? null;
      }
    }

    const { data, error } = await this.supabase.db
      .from("leads")
      .insert({
        ...leadData,
        empresa_id: empresaId,
        status: "novo",
        criado_em: nowIso,
        atualizado_em: nowIso,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Erro ao criar lead:", error);
      return { error: "Database error" };
    }

    return { ok: true, lead: data };
  }
}
