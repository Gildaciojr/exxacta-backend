"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhooksModule = void 0;
const common_1 = require("@nestjs/common");
const supabase_service_1 = require("../supabase/supabase.service");
const lead_created_controller_1 = require("./lead-created.controller");
const lead_followup_controller_1 = require("./lead-followup.controller");
const lead_responded_controller_1 = require("./lead-responded.controller");
const lead_lost_controller_1 = require("./lead-lost.controller");
const lead_negociation_controller_1 = require("./lead-negociation.controller");
let WebhooksModule = class WebhooksModule {
};
exports.WebhooksModule = WebhooksModule;
exports.WebhooksModule = WebhooksModule = __decorate([
    (0, common_1.Module)({
        controllers: [
            lead_created_controller_1.LeadCreatedController,
            lead_followup_controller_1.LeadFollowupController,
            lead_responded_controller_1.LeadRespondedController,
            lead_lost_controller_1.LeadLostController,
            lead_negociation_controller_1.LeadNegociationController,
        ],
        providers: [supabase_service_1.SupabaseService],
    })
], WebhooksModule);
