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
exports.LeadCreatedController = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const utils_1 = require("./utils");
const PERFIS_VALIDOS = [
    "ceo",
    "diretor",
    "socio",
    "contador",
    "gerente",
    "outro",
    "decisor",
];
function normalizarPerfil(perfil) {
    if (!perfil)
        return "outro";
    const p = perfil.trim().toLowerCase();
    return PERFIS_VALIDOS.includes(p) ? p : "outro";
}
let LeadCreatedController = class LeadCreatedController {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async handle(body) {
        const lead = body?.lead ?? {};
        if (!lead.nome || !lead.linkedin_url) {
            return { error: "Missing required fields (nome, linkedin_url)" };
        }
        const nowIso = new Date().toISOString();
        const hasValidId = (0, utils_1.isUuid)(lead.id ?? null);
        const payload = {
            nome: lead.nome,
            cargo: lead.cargo ?? null,
            linkedin_url: lead.linkedin_url,
            email: lead.email ?? null,
            telefone: lead.telefone ?? null,
            perfil: normalizarPerfil(lead.perfil),
            empresa_id: lead.empresa_id ?? null,
            status: "novo",
            atualizado_em: nowIso,
        };
        if (hasValidId) {
            payload.id = lead.id;
        }
        const { data, error } = await this.supabase.db
            .from("leads")
            .upsert(payload, { onConflict: "id" })
            .select("*")
            .single();
        if (error) {
            console.error("Erro lead-created:", error);
            return { error: "Database error" };
        }
        return { ok: true, lead: data };
    }
};
exports.LeadCreatedController = LeadCreatedController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], LeadCreatedController.prototype, "handle", null);
exports.LeadCreatedController = LeadCreatedController = __decorate([
    (0, common_1.Controller)("/api/webhooks/n8n/lead-created"),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], LeadCreatedController);
