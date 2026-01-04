import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "./utils";

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
  async handle(@Body() body: { lead?: LeadPayload }) {
    const lead = body?.lead ?? {};

    if (!lead.nome || !lead.linkedin_url) {
      return { error: "Missing required fields (nome, linkedin_url)" };
    }

    const nowIso = new Date().toISOString();
    const hasValidId = isUuid(lead.id ?? null);

    const payload: any = {
      nome: lead.nome,
      cargo: lead.cargo ?? null,
      linkedin_url: lead.linkedin_url,
      email: lead.email ?? null,
      telefone: lead.telefone ?? null,
      perfil: normalizarPerfil(lead.perfil),
      empresa_id: lead.empresa_id ?? null,
      status: "novo",
      atualizado_em: nowIso,
    };

    if (hasValidId) {
      payload.id = lead.id;
    }

    const { data, error } = await this.supabase.db
      .from("leads")
      .upsert(payload, { onConflict: "id" })
      .select("*")
      .single();

    if (error) {
      console.error("Erro lead-created:", error);
      return { error: "Database error" };
    }

    return { ok: true, lead: data };
  }
}
