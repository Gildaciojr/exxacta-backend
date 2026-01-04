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

    await this.supabase.db
      .from("leads")
      .update({ status: "email_enviado", atualizado_em: nowIso })
      .eq("id", leadId);

    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status: "email_enviado",
      canal: "email",
      observacao: "Follow-up automático inicial via n8n",
      criado_em: nowIso,
    });

    return {
      ok: true,
      lead_id: leadId,
      status: "email_enviado",
    };
  }
}
