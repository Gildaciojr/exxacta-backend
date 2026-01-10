type ApifyLeadInput = Record<string, any>;

export function normalizeApifyLead(input: ApifyLeadInput) {
  const nome =
    input.nome_completo ||
    [input.primeiro_nome, input.sobrenome].filter(Boolean).join(" ") ||
    null;

  const email =
    input["e-mail"] ||
    input.email ||
    input.personal_email ||
    null;

  const telefone =
    input.numero_de_celular ||
    input.company_phone ||
    null;

  const cargo =
    input.cargo ||
    input.titulo ||
    null;

  const linkedinPessoa =
    input.linkedin ||
    input.linkedin_url ||
    null;

  const empresa = {
    nome: input.nome_da_empresa || null,
    site: input.site_da_empresa || null,
    linkedin_url: input._company_linkedin || null,
    industria: input.Indústria || null,
    cidade: input.cidade_da_empresa || input.cidade || null,
    estado: input.company_state || input.estado || null,
    pais: input.company_country || input.país || "Brasil",
    tamanho_funcionarios:
      typeof input.tamanho_da_empresa === "number"
        ? input.tamanho_da_empresa
        : null,
  };

  return {
    lead: {
      nome,
      cargo,
      email,
      telefone,
      linkedin_url: linkedinPessoa,
      perfil: cargo ? "decisor" : "outro", // pode evoluir depois
      origem: "apify",
    },
    empresa,
  };
}
