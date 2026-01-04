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
exports.LeadLostController = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const utils_1 = require("./utils");
let LeadLostController = class LeadLostController {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async handle(body) {
        const leadId = body?.lead?.id ?? null;
        if (!(0, utils_1.isUuid)(leadId)) {
            return { error: "Lead ID inválido" };
        }
        const nowIso = new Date().toISOString();
        await this.supabase.db
            .from("leads")
            .update({ status: "perdido", atualizado_em: nowIso })
            .eq("id", leadId);
        await this.supabase.db.from("interacoes").insert({
            lead_id: leadId,
            status: "perdido",
            canal: "automacao_n8n",
            observacao: "Marcado como perdido automaticamente (n8n).",
            criado_em: nowIso,
        });
        return { ok: true, lead_id: leadId, status: "perdido" };
    }
};
exports.LeadLostController = LeadLostController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeadLostController.prototype, "handle", null);
exports.LeadLostController = LeadLostController = __decorate([
    (0, common_1.Controller)("/api/webhooks/n8n/lead-lost"),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], LeadLostController);
