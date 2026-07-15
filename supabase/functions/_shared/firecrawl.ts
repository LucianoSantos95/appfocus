// Shared Firecrawl helper — routes through the Lovable connector gateway.
// Gateway path = /{connector} + the API path after the host (mirrors _shared/slack.ts).
// Firecrawl's API is api.firecrawl.dev/v1/... → gateway /firecrawl/v1/...
const GATEWAY_URL = "https://connector-gateway.lovable.dev/firecrawl";

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
  return !!(Deno.env.get("LOVABLE_API_KEY") && Deno.env.get("FIRECRAWL_API_KEY"));
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
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
  if (!LOVABLE_API_KEY || !FIRECRAWL_API_KEY) {
    return { ok: false, status: 500, error: "Firecrawl connector não configurado." };
  }

  try {
    const res = await fetch(`${GATEWAY_URL}/v1/scrape`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": FIRECRAWL_API_KEY,
      },
      body: JSON.stringify({
        url: website,
        onlyMainContent: true,
        formats: ["json"],
        jsonOptions: {
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
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok || data?.success === false) {
      console.error(`[firecrawl] ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
      return { ok: false, status: res.status, error: data?.error ?? `Firecrawl respondeu ${res.status}` };
    }

    // Support both response shapes: newer { data: { json } } and older { data: { extract } }.
    const ext = data?.data?.json ?? data?.data?.extract ?? data?.json ?? data?.extract ?? {};
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
