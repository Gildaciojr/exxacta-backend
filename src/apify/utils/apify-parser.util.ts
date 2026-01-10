// src/apify/utils/apify-parser.util.ts

export type ApifyRawItem = {
  primeiro_nome?: string | null;
  sobrenome?: string | null;
  nome_completo?: string | null;

  email?: string | null;
  personal_email?: string | null;
  numero_de_celular?: string | null;

  job_title?: string | null;
  headline?: string | null;

  linkedin?: string | null;

  nome_da_empresa?: string | null;
  site_da_empresa?: string | null;
  company_linkedin?: string | null;
  company_linkedin_uid?: string | null;

  Industria?: string | null;

  tamanho_da_empresa?: number | null;

  cidade?: string | null;
  estado?: string | null;
  país?: string | null;

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
    linkedin_url: string;
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

function normalizePerfil(jobTitle?: string | null): string {
  if (!jobTitle) return "decisor";

  const v = jobTitle.toLowerCase();

  if (v.includes("sócio")) return "socio";
  if (v.includes("ceo")) return "ceo";
  if (v.includes("diretor")) return "diretor";
  if (v.includes("gerente")) return "gerente";
  if (v.includes("contador")) return "contador";

  return "decisor";
}

function normalizeText(v?: string | null): string {
  return (v ?? "").toString().trim();
}

export function parseApifyItem(item: ApifyRawItem): NormalizedApifyResult | null {
  const nomeCompleto = normalizeText(item.nome_completo);
  const primeiro = normalizeText(item.primeiro_nome);
  const sobrenome = normalizeText(item.sobrenome);

  const nome =
    nomeCompleto ||
    [primeiro, sobrenome].filter((x) => !!x).join(" ").trim();

  if (!nome) return null;

  const linkedin = normalizeText(item.linkedin);
  if (!linkedin) return null;

  const empresaNome = normalizeText(item.nome_da_empresa);
  if (!empresaNome) return null;

  const tamanho =
    typeof item.tamanho_da_empresa === "number" && !Number.isNaN(item.tamanho_da_empresa)
      ? item.tamanho_da_empresa
      : null;

  return {
    lead: {
      nome,
      email: item.email ?? item.personal_email ?? null,
      telefone: item.numero_de_celular ?? item.company_phone ?? null,
      cargo: item.job_title ?? item.headline ?? null,
      linkedin_url: linkedin,
      perfil: normalizePerfil(item.job_title),
      origem: "apify",
    },
    empresa: {
      nome: empresaNome,
      site: item.site_da_empresa ?? null,
      linkedin_url: item.company_linkedin ?? null,
      industria: item.Industria ?? null,
      cidade: item.company_city ?? item.cidade ?? null,
      estado: item.company_state ?? item.estado ?? null,
      pais: item.company_country ?? item.país ?? "Brasil",
      tamanho_funcionarios: tamanho,
    },
  };
}
