import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { asaas, findOrCreateCustomer, isAsaasConfigured, PLAN_VALUES } from "../_shared/asaas.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sessão expirada. Faça login novamente." }, 401);

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user?.email) return json({ error: "Não foi possível validar sua sessão." }, 401);
    const user = userData.user;

    if (!isAsaasConfigured()) return json({ error: "Pix (Asaas) não está configurado neste projeto." }, 503);

    const { plan, cycle } = await req.json();
    if (!plan || !PLAN_VALUES[plan]) return json({ error: "Plano inválido." }, 400);
    const billingCycle: "monthly" | "annual" = cycle === "annual" ? "annual" : "monthly";
    const value = PLAN_VALUES[plan][billingCycle];

    // Name from profile (best-effort).
    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: profile } = await service.from("profiles").select("display_name").eq("user_id", user.id).maybeSingle();
    const name = profile?.display_name || (user.user_metadata as any)?.full_name || user.email;

    const customerId = await findOrCreateCustomer(user.id, name, user.email);
    if (!customerId) return json({ error: "Falha ao criar cliente no Asaas." }, 502);

    const today = new Date().toISOString().slice(0, 10);
    // externalReference carries user + plan so the webhook can map the payment back with no local lookup.
    const sub = await asaas("/subscriptions", "POST", {
      customer: customerId,
      billingType: "PIX",
      value,
      nextDueDate: today,
      cycle: billingCycle === "annual" ? "YEARLY" : "MONTHLY",
      externalReference: `${user.id}|${plan}`,
      description: `Hub Empresarial — plano ${plan} (${billingCycle === "annual" ? "anual" : "mensal"})`,
    });
    if (!sub.ok || !sub.data?.id) return json({ error: sub.data?.errors?.[0]?.description || "Falha ao criar a assinatura Pix." }, sub.status || 502);

    // The first charge is generated with the subscription — return its hosted Pix page.
    const payments = await asaas(`/subscriptions/${sub.data.id}/payments?limit=1`);
    const first = payments.ok && Array.isArray(payments.data?.data) ? payments.data.data[0] : null;
    const url = first?.invoiceUrl ?? sub.data?.invoiceUrl ?? null;
    if (!url) return json({ error: "Assinatura criada, mas não retornou a URL de pagamento." }, 502);

    return json({ url, subscription_id: sub.data.id });
  } catch (e) {
    console.error("create-asaas-checkout error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
