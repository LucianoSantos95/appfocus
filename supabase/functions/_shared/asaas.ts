// Asaas gateway helper — Pix (and recurring Pix) for the Brazilian market.
// Sandbox by default; set ASAAS_ENV=prod to go live. Auth is the `access_token` header.
const ASAAS_BASE = (Deno.env.get("ASAAS_ENV") ?? "sandbox") === "prod"
  ? "https://api.asaas.com/v3"
  : "https://api-sandbox.asaas.com/v3";

export function isAsaasConfigured(): boolean {
  return !!Deno.env.get("ASAAS_API_KEY");
}

function authHeaders(): Record<string, string> {
  return { "Content-Type": "application/json", access_token: Deno.env.get("ASAAS_API_KEY") ?? "" };
}

export async function asaas(path: string, method = "GET", body?: unknown): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(`${ASAAS_BASE}${path}`, {
    method,
    headers: authHeaders(),
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) console.error(`[asaas] ${method} ${path} → ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  return { ok: res.ok, status: res.status, data };
}

/** Find the Asaas customer for a user (by externalReference) or create one. */
export async function findOrCreateCustomer(userId: string, name: string, email: string): Promise<string | null> {
  const found = await asaas(`/customers?externalReference=${encodeURIComponent(userId)}&limit=1`);
  if (found.ok && Array.isArray(found.data?.data) && found.data.data.length > 0) {
    return found.data.data[0].id as string;
  }
  const created = await asaas("/customers", "POST", {
    name: name || email,
    email,
    externalReference: userId,
    notificationDisabled: false,
  });
  return created.ok ? (created.data.id as string) : null;
}

// Monthly / annual price per plan (BRL), mirroring src/lib/stripe-plans + Planos.tsx.
export const PLAN_VALUES: Record<string, { monthly: number; annual: number }> = {
  plus: { monthly: 69, annual: 660 },
  pro: { monthly: 149, annual: 1428 },
  enterprise: { monthly: 297, annual: 2844 },
};
