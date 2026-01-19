export function validateEnv() {
  const required = [
    "SUPABASE_URL",
    "SUPABASE_SERVICE_ROLE_KEY",
    "EXXACTA_N8N_SECRET",
    "N8N_WEBHOOK_LEAD_STATUS", // OBRIGATÓRIA
  ];

  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Variáveis de ambiente ausentes: ${missing.join(", ")}`
    );
  }
}
