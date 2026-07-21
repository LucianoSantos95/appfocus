import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { asaas, isAsaasConfigured, PLAN_VALUES } from "../_shared/asaas.ts";

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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sessão expirada. Faça login novamente." }, 401);

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user?.email) return json({ error: "Não foi possível validar sua sessão." }, 401);
    const user = userData.user;

    if (!isAsaasConfigured()) return json({ error: "Gateway de pagamento não está configurado." }, 503);

    const { plan, cycle } = await req.json();
    if (!plan || !PLAN_VALUES[plan]) return json({ error: "Plano inválido." }, 400);
    const billingCycle: "monthly" | "annual" = cycle === "annual" ? "annual" : "monthly";
    const value = PLAN_VALUES[plan][billingCycle];

    const origin = req.headers.get("origin") ?? "https://app.focusinteligente.com.br";
    const today = new Date().toISOString().slice(0, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 60 min

    // Checkout hospedado: o próprio cliente preenche nome/CPF/CNPJ/telefone
    // e escolhe entre Pix, Boleto ou Cartão na página do Asaas.
    const checkout = await asaas("/checkouts", "POST", {
      billingTypes: ["CREDIT_CARD", "PIX", "BOLETO"],
      chargeTypes: ["RECURRENT"],
      minutesToExpire: 60,
      expiresAt,
      callback: {
        successUrl: `${origin}/planos?success=true`,
        cancelUrl: `${origin}/planos?canceled=true`,
        expiredUrl: `${origin}/planos?expired=true`,
      },
      items: [{
        name: `Hub Empresarial — ${plan}`,
        description: `Assinatura ${billingCycle === "annual" ? "anual" : "mensal"} do plano ${plan}`,
        quantity: 1,
        value,
      }],
      subscription: {
        cycle: billingCycle === "annual" ? "YEARLY" : "MONTHLY",
        nextDueDate: today,
      },
      customerData: {
        email: user.email,
      },
      externalReference: `${user.id}|${plan}|${billingCycle}`,
    });

    if (!checkout.ok) {
      const msg = checkout.data?.errors?.[0]?.description
        || checkout.data?.message
        || "Falha ao criar checkout no gateway.";
      return json({ error: msg }, checkout.status || 502);
    }

    const url = checkout.data?.link ?? checkout.data?.url ?? null;
    if (!url) return json({ error: "Checkout criado mas sem URL de pagamento." }, 502);

    return json({ url, checkout_id: checkout.data?.id });
  } catch (e) {
    console.error("create-asaas-checkout error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
