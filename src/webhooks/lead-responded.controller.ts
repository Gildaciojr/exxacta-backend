import { Body, Controller, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "./utils";

@Controller("/api/webhooks/n8n/lead-responded")
export class LeadRespondedController {
  constructor(private readonly supabase: SupabaseService) {}

  @Post()
  async handle(@Body() body: any) {
    const leadId = body?.lead?.id ?? null;

    if (!isUuid(leadId)) {
      return { error: "Lead ID inválido" };
    }

    const nowIso = new Date().toISOString();

    await this.supabase.db
      .from("leads")
      .update({ status: "interessado", atualizado_em: nowIso })
      .eq("id", leadId);

    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status: "respondeu",
      canal: "email",
      observacao: "Lead respondeu ao contato automático (n8n).",
      criado_em: nowIso,
    });

    return { ok: true, lead_id: leadId, status: "interessado" };
  }
}
