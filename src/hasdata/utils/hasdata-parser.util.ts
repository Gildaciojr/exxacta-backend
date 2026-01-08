// src/hasdata/utils/hasdata-parser.util.ts
import * as XLSX from "xlsx";

export type NormalizedHasdataItem = {
  company_name: string;
  phone?: string | null;
  website?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  employees?: number | null;
  linkedin?: string | null;
  owner_name?: string | null;
  owner_linkedin?: string | null;
};

export async function fetchAndParseHasdata(
  url: string
): Promise<NormalizedHasdataItem[]> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Falha ao baixar arquivo HasData");
  }

  const contentType = response.headers.get("content-type") || "";

  // =========================
  // JSON
  // =========================
  if (contentType.includes("application/json")) {
    const json = await response.json();
    const results = Array.isArray(json.results) ? json.results : json;

    return results.map(mapHasdataItem);
  }

  // =========================
  // XLSX
  // =========================
  const buffer = Buffer.from(await response.arrayBuffer());
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<any>(sheet);

  return rows.map(mapHasdataItem);
}

function mapHasdataItem(item: any): NormalizedHasdataItem {
  return {
    company_name: item.company_name || item.name || item.title,
    phone: item.phone || null,
    website: item.website || null,
    city: item.city || null,
    state: item.state || null,
    country: item.country || "Brasil",
    employees: Number(item.employees) || null,
    linkedin: item.linkedin || null,
    owner_name: item.owner_name || null,
    owner_linkedin: item.owner_linkedin || null,
  };
}
