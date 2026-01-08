// src/status/status.controller.ts
import { Body, Controller, Get, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "../webhooks/utils";

/**
 * Controller responsável por:
 * - Atualização de status do lead (manual ou automação)
 * - Registro de interações
 * - Disparo de webhook para o n8n (automação)
 */
@Controller("/api/status")
export class StatusController {
  constructor(private readonly supabase: SupabaseService) {}

  // =========================================================
  // HEALTHCHECK (EasyPanel / Monitoramento)
  // =========================================================
  @Get()
  health() {
    return {
      status: "ok",
      service: "exxacta-backend",
      timestamp: new Date().toISOString(),
    };
  }

  // =========================================================
  // Atualização de status do lead (dashboard / automações)
  // =========================================================
  @Post()
  async update(@Body() body: any) {
    const leadId = body?.lead_id ?? null;
    const status = body?.status ?? null;

    if (!isUuid(leadId) || !status) {
      return { error: "lead_id ou status inválido" };
    }

    const nowIso = new Date().toISOString();

    // -------------------------------------------------------
    // 1) Atualiza o lead
    // -------------------------------------------------------
    await this.supabase.db
      .from("leads")
      .update({
        status,
        atualizado_em: nowIso,
      })
      .eq("id", leadId);

    // -------------------------------------------------------
    // 2) Registra interação (auditoria / histórico)
    // -------------------------------------------------------
    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status,
      canal: "automacao_n8n",
      observacao: `Status atualizado via dashboard → ${status}`,
      criado_em: nowIso,
    });

    // -------------------------------------------------------
    // 3) DISPARA WEBHOOK PARA O N8N (PONTE CRÍTICA)
    // -------------------------------------------------------
    const n8nWebhookUrl = process.env.N8N_WEBHOOK_LEAD_STATUS;
    const n8nSecret = process.env.EXXACTA_N8N_SECRET;

    if (n8nWebhookUrl) {
      try {
        await fetch(n8nWebhookUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-exxacta-signature": n8nSecret ?? "",
          },
          body: JSON.stringify({
            event: "lead.status_changed",
            lead: {
              id: leadId,
              status,
            },
            timestamp: nowIso,
          }),
        });
      } catch (error) {
        console.error(
          "[N8N] Falha ao disparar webhook lead.status_changed",
          error
        );
      }
    }

    // -------------------------------------------------------
    // 4) Retorno padrão (frontend)
    // -------------------------------------------------------
    return {
      ok: true,
      lead_id: leadId,
      status,
    };
  }
}
