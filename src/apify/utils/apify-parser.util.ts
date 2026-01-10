export type ApifyRawItem = {
  fullName?: string;
  firstName?: string;
  lastName?: string;
  jobTitle?: string;
  profileUrl?: string;
  email?: string;
  phone?: string;

  companyName?: string;
  companyLinkedinUrl?: string;
  companyWebsite?: string;
  industry?: string;
  employeesCount?: number;
  location?: {
    city?: string;
    state?: string;
    country?: string;
  };
};

export type NormalizedApifyEmpresa = {
  nome: string;
  linkedin_url?: string | null;
  site?: string | null;
  industria?: string | null;
  cidade?: string | null;
  estado?: string | null;
  pais?: string | null;
  tamanho_funcionarios?: number | null;
};

export type NormalizedApifyLead = {
  nome: string;
  cargo?: string | null;
  email?: string | null;
  telefone?: string | null;
  linkedin_url: string;
  perfil: string;
  origem: "apify";
};

function mapPerfil(cargo?: string | null): string {
  if (!cargo) return "outro";
  const c = cargo.toLowerCase();

  if (c.includes("ceo")) return "ceo";
  if (c.includes("diretor")) return "diretor";
  if (c.includes("sócio") || c.includes("partner")) return "socio";
  if (c.includes("contador")) return "contador";
  if (c.includes("gerente")) return "gerente";

  return "decisor";
}

export function normalizeApifyItem(item: ApifyRawItem): {
  empresa: NormalizedApifyEmpresa;
  lead: NormalizedApifyLead;
} {
  const nomeLead =
    item.fullName ||
    [item.firstName, item.lastName].filter(Boolean).join(" ");

  if (!nomeLead || !item.profileUrl) {
    throw new Error("Lead inválido: nome ou LinkedIn ausente");
  }

  return {
    empresa: {
      nome: item.companyName ?? "Empresa sem nome",
      linkedin_url: item.companyLinkedinUrl ?? null,
      site: item.companyWebsite ?? null,
      industria: item.industry ?? null,
      cidade: item.location?.city ?? null,
      estado: item.location?.state ?? null,
      pais: item.location?.country ?? "Brasil",
      tamanho_funcionarios:
        typeof item.employeesCount === "number"
          ? item.employeesCount
          : null,
    },

    lead: {
      nome: nomeLead,
      cargo: item.jobTitle ?? null,
      email: item.email ?? null,
      telefone: item.phone ?? null,
      linkedin_url: item.profileUrl,
      perfil: mapPerfil(item.jobTitle),
      origem: "apify",
    },
  };
}
