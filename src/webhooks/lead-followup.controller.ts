// src/webhooks/lead-followup.controller.ts
import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "./utils";

@Controller("/api/webhooks/n8n/lead-followup")
export class LeadFollowupController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async handle(@Body() body: any) {
    const leadId = body?.lead?.id ?? null;

    if (!isUuid(leadId)) {
      return { error: "Lead ID inválido" };
    }

    const nowIso = new Date().toISOString();

    // Apenas registra o follow-up como interação.
    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status: "follow_up",
      canal: "email",
      observacao: "Follow-up automático (n8n) — etapa intermediária.",
      criado_em: nowIso,
    });

    // Atualiza somente o atualizado_em para refletir ação recente
    await this.supabase.db
      .from("leads")
      .update({ atualizado_em: nowIso })
      .eq("id", leadId);

    return { ok: true, lead_id: leadId, status: "follow_up" };
  }
}
