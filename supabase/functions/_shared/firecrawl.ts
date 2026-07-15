// Firecrawl helper — direct API mode (v2).
// The Firecrawl connection linked to this project is direct-API (not gateway),
// so we call https://api.firecrawl.dev/v2/... with Authorization: Bearer FIRECRAWL_API_KEY.
const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

export interface CompanyEnrichment {
  name?: string;
  website?: string;
  industry?: string;
  employees?: number;
  annualRevenue?: number;
  phone?: string;
  location?: string;
  description?: string;
  keywords?: string[];
  linkedin?: string;
  raw?: unknown;
}

export interface EnrichResult {
  ok: boolean;
  status: number;
  data?: CompanyEnrichment;
  error?: string;
}

export function isFirecrawlConfigured(): boolean {
  return !!Deno.env.get("FIRECRAWL_API_KEY");
}

function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = parseInt(v.replace(/[^\d]/g, ""), 10);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return undefined;
}

/** Enrich a company by scraping its website and extracting structured fields with AI. */
export async function enrichCompanyByWebsite(website: string): Promise<EnrichResult> {
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!FIRECRAWL_API_KEY) {
    return { ok: false, status: 500, error: "Firecrawl não está configurado." };
  }

  try {
    console.log(`[firecrawl] key_prefix=${FIRECRAWL_API_KEY.slice(0, 5)} len=${FIRECRAWL_API_KEY.length}`);
    const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify({
        url: website,
        onlyMainContent: true,
        formats: [
          {
            type: "json",
            prompt:
              "A partir do conteúdo do site desta empresa, extraia os dados solicitados. " +
              "Responda em português. Se algum campo não estiver claro, deixe-o vazio.",
            schema: {
              type: "object",
              properties: {
                name: { type: "string", description: "Nome da empresa" },
                industry: { type: "string", description: "Setor / segmento de atuação" },
                description: { type: "string", description: "Descrição curta do que a empresa faz" },
                services: { type: "array", items: { type: "string" }, description: "Principais serviços ou produtos" },
                employees: { type: "string", description: "Número aproximado de funcionários, se mencionado" },
                location: { type: "string", description: "Cidade/estado/país da sede" },
                phone: { type: "string", description: "Telefone de contato" },
              },
            },
          },
        ],
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      const bodyStr = JSON.stringify(data).slice(0, 400);
      console.error(`[firecrawl] ${res.status}: ${bodyStr}`);
      return { ok: false, status: res.status, error: data?.error ?? `Firecrawl respondeu ${res.status}` };
    }

    // v2 response: { success: true, data: { json: {...}, metadata: {...} } }
    // Fallback to older shapes for safety.
    const ext =
      data?.data?.json ??
      data?.data?.extract ??
      data?.json ??
      data?.extract ??
      {};
    const keywords = Array.isArray(ext.services) ? ext.services.slice(0, 12) : undefined;

    return {
      ok: true,
      status: res.status,
      data: {
        name: ext.name,
        website,
        industry: ext.industry,
        description: ext.description,
        employees: toNumber(ext.employees),
        phone: ext.phone,
        location: ext.location,
        keywords,
        raw: ext,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[firecrawl] fetch failed: ${msg}`);
    return { ok: false, status: 0, error: msg };
  }
}
