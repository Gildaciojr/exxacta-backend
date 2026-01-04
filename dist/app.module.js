"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const supabase_service_1 = require("./supabase/supabase.service");
const validate_n8n_signature_middleware_1 = require("./common/middleware/validate-n8n-signature.middleware");
const webhooks_module_1 = require("./webhooks/webhooks.module");
const hasdata_module_1 = require("./hasdata/hasdata.module");
const status_module_1 = require("./status/status.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(validate_n8n_signature_middleware_1.ValidateN8nSignatureMiddleware)
            .forRoutes("api/webhooks");
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            webhooks_module_1.WebhooksModule,
            hasdata_module_1.HasdataModule,
            status_module_1.StatusModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [supabase_service_1.SupabaseService],
    })
], AppModule);
