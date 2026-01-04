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
exports.HasdataController = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
let HasdataController = class HasdataController {
    constructor(supabase) {
        this.supabase = supabase;
    }
    async import(body) {
        const { nome, telefone, endereco, site, origem, status, } = body;
        if (!nome) {
            return { error: "Nome é obrigatório" };
        }
        // Evita duplicação por nome + telefone
        const { data: existente } = await this.supabase.db
            .from("leads")
            .select("id")
            .eq("nome", nome)
            .eq("telefone", telefone ?? "")
            .maybeSingle();
        if (existente) {
            return { skipped: true, reason: "Lead já existe" };
        }
        const { data, error } = await this.supabase.db
            .from("leads")
            .insert({
            nome,
            telefone: telefone ?? null,
            linkedin_url: site ?? "",
            perfil: "outro",
            status: status ?? "novo",
        })
            .select("*")
            .single();
        if (error) {
            console.error("Erro HasData import:", error);
            return { error: "Database error" };
        }
        return { ok: true, lead: data };
    }
};
exports.HasdataController = HasdataController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HasdataController.prototype, "import", null);
exports.HasdataController = HasdataController = __decorate([
    (0, common_1.Controller)("/api/hasdata/import"),
    __metadata("design:paramtypes", [supabase_service_1.SupabaseService])
], HasdataController);
