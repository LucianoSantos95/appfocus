// Asaas gateway helper — Pix, Boleto e Cartão (recorrentes) para o mercado BR.
// Sandbox por padrão; defina ASAAS_ENV=prod para produção. Auth via header `access_token`.
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

/** Localiza cliente Asaas por externalReference (=user.id) ou cria um. */
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

/** Lista assinaturas ativas do cliente. */
export async function listActiveSubscriptions(customerId: string): Promise<any[]> {
  const r = await asaas(`/subscriptions?customer=${encodeURIComponent(customerId)}&status=ACTIVE&limit=20`);
  return r.ok && Array.isArray(r.data?.data) ? r.data.data : [];
}

/** Cancela (deleta) uma assinatura Asaas. */
export async function deleteSubscription(subscriptionId: string): Promise<boolean> {
  const r = await asaas(`/subscriptions/${subscriptionId}`, "DELETE");
  return r.ok;
}

/** Converte o `method` do frontend em `billingType` do Asaas. */
export function toBillingType(method?: string): "PIX" | "BOLETO" | "CREDIT_CARD" | "UNDEFINED" {
  switch ((method ?? "").toLowerCase()) {
    case "pix": return "PIX";
    case "boleto": return "BOLETO";
    case "credit_card":
    case "card":
    case "cartao": return "CREDIT_CARD";
    default: return "UNDEFINED"; // Asaas exibe as 3 opções na página hospedada
  }
}

// Preços por plano (BRL) — espelham src/pages/Planos.tsx.
export const PLAN_VALUES: Record<string, { monthly: number; annual: number }> = {
  plus: { monthly: 69, annual: 660 },
  pro: { monthly: 149, annual: 1428 },
  enterprise: { monthly: 297, annual: 2844 },
};
