// src/apify/utils/apify-parser.util.ts

export type ApifyRawItem = {
  first_name?: string | null;
  last_name?: string | null;
  full_name?: string | null;

  email?: string | null;
  personal_email?: string | null;
  mobile_number?: string | null;

  job_title?: string | null;
  headline?: string | null;
  linkedin?: string | null;

  company_name?: string | null;
  company_website?: string | null;
  company_linkedin?: string | null;
  industry?: string | null;
  company_size?: number | null;

  city?: string | null;
  state?: string | null;
  country?: string | null;

  company_city?: string | null;
  company_state?: string | null;
  company_country?: string | null;
  company_phone?: string | null;
};

export type NormalizedApifyResult = {
  lead: {
    nome: string;
    email: string | null;
    telefone: string | null;
    cargo: string | null;
    linkedin_url: string | null;
    perfil: string;
    origem: "apify";
  };
  empresa: {
    nome: string;
    site: string | null;
    linkedin_url: string | null;
    industria: string | null;
    cidade: string | null;
    estado: string | null;
    pais: string;
    tamanho_funcionarios: number | null;
  };
};

function txt(v?: string | null): string {
  return (v ?? "").toString().trim();
}

function perfilFromCargo(v?: string | null): string {
  const t = txt(v).toLowerCase();
  if (t.includes("ceo")) return "ceo";
  if (t.includes("sócio") || t.includes("socio")) return "socio";
  if (t.includes("diretor")) return "diretor";
  if (t.includes("gerente")) return "gerente";
  return "decisor";
}

export function parseApifyItem(item: ApifyRawItem): NormalizedApifyResult {
  const nomeLead =
    txt(item.full_name) ||
    `${txt(item.first_name)} ${txt(item.last_name)}`.trim() ||
    "Contato sem nome";

  const nomeEmpresa = txt(item.company_name) || "Empresa sem nome";

  const tamanho =
    typeof item.company_size === "number" && !Number.isNaN(item.company_size)
      ? item.company_size
      : null;

  return {
    lead: {
      nome: nomeLead,
      email: txt(item.email) || null,
      telefone: txt(item.mobile_number) || txt(item.company_phone) || null,
      cargo: txt(item.job_title) || txt(item.headline) || null,
      linkedin_url: txt(item.linkedin) || null,
      perfil: perfilFromCargo(item.job_title),
      origem: "apify",
    },
    empresa: {
      nome: nomeEmpresa,
      site: txt(item.company_website) || null,
      linkedin_url: txt(item.company_linkedin) || null,
      industria: txt(item.industry) || null,
      cidade: txt(item.company_city) || txt(item.city) || null,
      estado: txt(item.company_state) || txt(item.state) || null,
      pais: txt(item.company_country) || txt(item.country) || "Brasil",
      tamanho_funcionarios: tamanho,
    },
  };
}
