import { Body, Controller, Get, Post } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "../webhooks/utils";

const STATUS_VALIDOS = [
  "novo",
  "email_enviado",
  "aquecimento",
  "contatado",
  "em_conversa", // 🔥 ÚNICO GATILHO N8N
  "interessado",
  "qualificado",
  "frio",
  "fechado",
  "perdido",
  "negociacao",
  "follow_up",
  "sem_resposta",
] as const;

type StatusValido = (typeof STATUS_VALIDOS)[number];

@Controller("/api/status")
export class StatusController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get()
  health() {
    return { status: "ok" };
  }

  @Post()
  async update(
    @Body() body: { lead_id: string; status: string }
  ): Promise<{
    ok: boolean;
    lead_id?: string;
    status?: string;
    n8n_triggered?: boolean;
    error?: string;
    allowed?: readonly string[];
  }> {
    const leadId = body?.lead_id;
    let status = body?.status;

    if (!isUuid(leadId) || !status) {
      return { ok: false, error: "lead_id ou status inválido" };
    }

    status = status.trim().toLowerCase();

    if (!STATUS_VALIDOS.includes(status as StatusValido)) {
      return {
        ok: false,
        error: "Status inválido",
        allowed: STATUS_VALIDOS,
      };
    }

    // 🔥 REGRA FINAL: sem_resposta SEMPRE vira perdido
    if (status === "sem_resposta") {
      status = "perdido";
    }

    const nowIso = new Date().toISOString();

    // 1️⃣ Buscar status atual do lead (ANTI DUPLICAÇÃO)
    const { data: leadAtual, error: leadError } =
      await this.supabase.db
        .from("leads")
        .select("id, status")
        .eq("id", leadId)
        .single();

    if (leadError || !leadAtual) {
      return {
        ok: false,
        error: "Lead não encontrado no banco",
      };
    }

    const statusAnterior = leadAtual.status;

    // 2️⃣ Atualiza lead
    await this.supabase.db
      .from("leads")
      .update({
        status,
        atualizado_em: nowIso,
      })
      .eq("id", leadId);

    // 3️⃣ Registra interação (sempre)
    await this.supabase.db.from("interacoes").insert({
      lead_id: leadId,
      status,
      canal: "dashboard",
      observacao: `Status alterado para ${status}`,
      criado_em: nowIso,
    });

    // 4️⃣ DISPARA N8N APENAS NA TRANSIÇÃO PARA em_conversa
    const deveDispararN8n =
      status === "em_conversa" && statusAnterior !== "em_conversa";

    if (deveDispararN8n) {
      const url = process.env.N8N_WEBHOOK_LEAD_STATUS;
      const secret = process.env.EXXACTA_N8N_SECRET;

      if (url) {
        try {
          await fetch(url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "x-exxacta-signature": secret ?? "",
            },
            body: JSON.stringify({
              event: "lead.status_changed",
              lead: {
                id: leadId,
                status: "em_conversa",
              },
              timestamp: nowIso,
            }),
          });
        } catch (err) {
          console.error("[N8N] Erro ao disparar automação", err);
        }
      }
    }

    return {
      ok: true,
      lead_id: leadId,
      status,
      n8n_triggered: deveDispararN8n,
    };
  }
}
