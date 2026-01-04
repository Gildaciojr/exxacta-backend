// src/status/status.controller.ts
import { Body, Controller, Get, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "../webhooks/utils";

@Controller("/api/status")
export class StatusController {
  constructor(private readonly supabase: SupabaseService) {}

  // =========================================================
  // HEALTHCHECK (monitoramento / EasyPanel / debug)
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
  // Atualização manual/automática de status do lead
  // =========================================================
  @Post()
  async update(@Body() body: any) {
    const leadId = body?.lead_id ?? null;
    const status = body?.status ?? null;

    if (!isUuid(leadId) || !status) {
      return { error: "lead_id ou status inválido" };
    }

    const nowIso = new Date().toISOString();

    await this.supabase.db
      .from("leads")
      .update({ status, atualizado_em: nowIso })
      .eq("id", leadId);

    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status,
      canal: "automacao_n8n",
      observacao: `Status atualizado automaticamente via /api/status → ${status}`,
      criado_em: nowIso,
    });

    return { ok: true, lead_id: leadId, status };
  }
}
