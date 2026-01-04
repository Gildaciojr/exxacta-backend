"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ValidateN8nSignatureMiddleware = void 0;
const common_1 = require("@nestjs/common");
let ValidateN8nSignatureMiddleware = class ValidateN8nSignatureMiddleware {
    use(req, _res, next) {
        const signature = req.header("x-exxacta-signature");
        const secret = process.env.EXXACTA_N8N_SECRET;
        if (!secret) {
            throw new common_1.UnauthorizedException("Servidor sem EXXACTA_N8N_SECRET configurado");
        }
        if (!signature || signature !== secret) {
            throw new common_1.UnauthorizedException("Assinatura inválida");
        }
        next();
    }
};
exports.ValidateN8nSignatureMiddleware = ValidateN8nSignatureMiddleware;
exports.ValidateN8nSignatureMiddleware = ValidateN8nSignatureMiddleware = __decorate([
    (0, common_1.Injectable)()
], ValidateN8nSignatureMiddleware);
