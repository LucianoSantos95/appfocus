// Shared Apollo.io helper — routes through the Lovable connector gateway.
// Mirrors _shared/slack.ts: the gateway path is /{connector} + Apollo's own path,
// authenticated with the Lovable API key + the connector's injected API key.
const GATEWAY_URL = "https://connector-gateway.lovable.dev/apollo";

export interface OrgEnrichment {
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

export interface ApolloResult {
  ok: boolean;
  status: number;
  data?: OrgEnrichment;
  error?: string;
}

export function isApolloConfigured(): boolean {
  return !!(Deno.env.get("LOVABLE_API_KEY") && Deno.env.get("APOLLO_API_KEY"));
}

/** Enrich a company by its web domain (e.g. "acme.com"). */
export async function enrichOrganizationByDomain(domain: string): Promise<ApolloResult> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const APOLLO_API_KEY = Deno.env.get("APOLLO_API_KEY");
  if (!LOVABLE_API_KEY || !APOLLO_API_KEY) {
    return { ok: false, status: 500, error: "Apollo connector não configurado (conecte o Apollo no Lovable)." };
  }

  try {
    const res = await fetch(
      `${GATEWAY_URL}/api/v1/organizations/enrich?domain=${encodeURIComponent(domain)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": APOLLO_API_KEY,
        },
      }
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error(`[apollo] ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
      return { ok: false, status: res.status, error: data?.error ?? `Apollo respondeu ${res.status}` };
    }

    const o = data.organization ?? data.org ?? {};
    return {
      ok: true,
      status: res.status,
      data: {
        name: o.name,
        website: o.website_url ?? o.website,
        industry: o.industry,
        employees: o.estimated_num_employees,
        annualRevenue: o.annual_revenue,
        phone: o.phone ?? o.primary_phone?.number ?? o.sanitized_phone,
        location: [o.city, o.state, o.country].filter(Boolean).join(", ") || undefined,
        description: o.short_description,
        keywords: Array.isArray(o.keywords) ? o.keywords.slice(0, 12) : undefined,
        linkedin: o.linkedin_url,
        raw: o,
      },
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[apollo] fetch failed: ${msg}`);
    return { ok: false, status: 0, error: msg };
  }
}
