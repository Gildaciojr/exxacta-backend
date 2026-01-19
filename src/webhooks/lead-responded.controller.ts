// src/webhooks/lead-responded.controller.ts
import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "./utils";

@Controller("/api/webhooks/n8n/lead-responded")
export class LeadRespondedController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async handle(@Body() body: any) {
    const leadIdRaw = body?.lead?.id ?? null;
    const emailRaw = body?.lead?.email ?? null;

    const email =
      typeof emailRaw === "string" ? emailRaw.trim().toLowerCase() : null;

    // 1) leadId
    let leadId: string | null = null;

    if (isUuid(leadIdRaw)) {
      leadId = leadIdRaw;
    } else if (email) {
      const { data: leadFound, error: findErr } = await this.supabase.db
        .from("leads")
        .select("id, email")
        .ilike("email", email)
        .order("criado_em", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (findErr || !leadFound?.id) {
        return { error: "Lead não encontrado por email", email };
      }

      leadId = leadFound.id;
    }

    if (!leadId) {
      return {
        error: "Payload inválido: informe lead.id (uuid) ou lead.email",
      };
    }

    const nowIso = new Date().toISOString();

    // 2) Atualiza lead -> interessado
    await this.supabase.db
      .from("leads")
      .update({ status: "interessado", atualizado_em: nowIso })
      .eq("id", leadId);

    // 3) Registra interação
    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status: "respondeu",
      canal: "email",
      observacao: "Lead respondeu ao contato automático (n8n / Gmail).",
      criado_em: nowIso,
    });

    return { ok: true, lead_id: leadId, status: "interessado" };
  }
}
