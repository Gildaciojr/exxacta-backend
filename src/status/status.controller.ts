// src/status/status.controller.ts
import { Body, Controller, Get, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "../webhooks/utils";

@Controller("/api/status")
export class StatusController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  health() {
    return {
      status: "ok",
      service: "exxacta-backend",
      timestamp: new Date().toISOString(),
    };
  }

  @Post()
  async update(@Body() body: any) {
    const leadId = body?.lead_id ?? null;
    let status = body?.status ?? null;

    if (!isUuid(leadId) || !status) {
      return { error: "lead_id ou status inválido" };
    }

    // ✅ Normalização defensiva
    if (typeof status === "string") status = status.trim().toLowerCase();

    // ✅ REGRA: dia 07 sem resposta => PERDIDO
    if (status === "sem_resposta") {
      status = "perdido";
    }

    const nowIso = new Date().toISOString();

    // 1) Atualiza lead
    await this.supabase.db
      .from("leads")
      .update({ status, atualizado_em: nowIso })
      .eq("id", leadId);

    // 2) Registra interação (histórico)
    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status,
      canal: "automacao_n8n",
      observacao: `Status atualizado via dashboard/n8n → ${status}`,
      criado_em: nowIso,
    });

    // 3) DISPARA N8N APENAS NO STATUS QUE INICIA A AUTOMAÇÃO
    // ✅ A automação deve iniciar SOMENTE quando vira "contatado"
    const deveDispararAutomacao = status === "contatado";

    const n8nWebhookUrl = process.env.N8N_WEBHOOK_LEAD_STATUS;
    const n8nSecret = process.env.EXXACTA_N8N_SECRET;

    if (deveDispararAutomacao && n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-exxacta-signature": n8nSecret ?? "",
          },
          body: JSON.stringify({
            event: "lead.status_changed",
            lead: { id: leadId, status },
            timestamp: nowIso,
          }),
        });
      } catch (error) {
        console.error("[N8N] Falha ao disparar lead.status_changed", error);
      }
    }

    return { ok: true, lead_id: leadId, status };
  }
}
