// src/leads/leads.controller.ts
import { Controller, Get, Param } from "@nestjs/common";
import { SupabaseService } from "../supabase/supabase.service";
import { isUuid } from "../webhooks/utils";

@Controller("/api/leads")
export class LeadsController {
  constructor(private readonly supabase: SupabaseService) {}

  @Get(":id")
  async findOne(@Param("id") id: string) {
    if (!isUuid(id)) {
      return { error: "ID inválido" };
    }

    const { data, error } = await this.supabase.db
      .from("leads")
      .select(
        `
        id,
        nome,
        email,
        telefone,
        status,
        empresas:empresa_id (
          nome
        )
      `
      )
      .eq("id", id)
      .single();

    if (error || !data) {
      return { error: "Lead não encontrado" };
    }

    const empresaNome =
      Array.isArray(data.empresas) && data.empresas.length > 0
        ? data.empresas[0].nome
        : null;

    return {
      id: data.id,
      nome: data.nome,
      email: data.email,
      telefone: data.telefone,
      status: data.status,
      empresa_nome: empresaNome,
    };
  }
}
