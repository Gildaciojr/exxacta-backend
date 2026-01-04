"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StatusController = void 0;
// src/status/status.controller.ts
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const utils_1 = require("../webhooks/utils");
let StatusController = class StatusController {
    constructor(supabase) {
        this.supabase = supabase;
    }
    // =========================================================
    // HEALTHCHECK (monitoramento / EasyPanel / debug)
    // =========================================================
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
    async update(body) {
        const leadId = body?.lead_id ?? null;
        const status = body?.status ?? null;
        if (!(0, utils_1.isUuid)(leadId) || !status) {
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
};
exports.StatusController = StatusController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], StatusController.prototype, "health", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StatusController.prototype, "update", null);
exports.StatusController = StatusController = __decorate([
    (0, common_1.Controller)("/api/status"),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], StatusController);
