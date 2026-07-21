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

    const { plan, cycle, mode } = await req.json();
    if (!plan || !PLAN_VALUES[plan]) return json({ error: "Plano inválido." }, 400);
    const billingCycle: "monthly" | "annual" = cycle === "annual" ? "annual" : "monthly";
    const paymentMode: "recurring" | "one_time" = mode === "recurring" ? "recurring" : "one_time";
    const value = PLAN_VALUES[plan][billingCycle];

    const origin = req.headers.get("origin") ?? "https://app.focusinteligente.com.br";
    const today = new Date().toISOString().slice(0, 10);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    // externalReference guarda contexto para o webhook processar (user|plan|cycle|mode)
    const externalReference = `${user.id}|${plan}|${billingCycle}|${paymentMode}`;

    const baseBody: Record<string, unknown> = {
      minutesToExpire: 60,
      expiresAt,
      callback: {
        successUrl: `${origin}/planos?success=true`,
        cancelUrl: `${origin}/planos?canceled=true`,
        expiredUrl: `${origin}/planos?expired=true`,
      },
      items: [{
        name: `Hub Empresarial — ${plan}`,
        description: `Plano ${plan} ${billingCycle === "annual" ? "anual" : "mensal"}${paymentMode === "recurring" ? " (cartão automático)" : " (Pix/Boleto/Cartão)"}`,
        quantity: 1,
        value,
      }],
      // Sem customerData: o Asaas exige cpfCnpj quando ele é enviado, e não temos o
      // CPF/CNPJ do usuário. Assim o próprio checkout hospedado coleta nome/e-mail/CPF.
      externalReference,
    };

    let checkoutBody: Record<string, unknown>;
    if (paymentMode === "recurring") {
      // Cartão recorrente — Asaas só aceita CREDIT_CARD para RECURRENT
      checkoutBody = {
        ...baseBody,
        chargeTypes: ["RECURRENT"],
        billingTypes: ["CREDIT_CARD"],
        subscription: {
          cycle: billingCycle === "annual" ? "YEARLY" : "MONTHLY",
          nextDueDate: today,
        },
      };
    } else {
      // Cobrança avulsa — oferece Pix, Boleto e Cartão na página hospedada.
      // (billingTypes NÃO aceita "UNDEFINED" no checkout; use os métodos explícitos.)
      checkoutBody = {
        ...baseBody,
        chargeTypes: ["DETACHED"],
        billingTypes: ["PIX", "BOLETO", "CREDIT_CARD"],
        dueDateLimitDays: 3,
      };
    }

    const checkout = await asaas("/checkouts", "POST", checkoutBody);

    if (!checkout.ok) {
      const msg = checkout.data?.errors?.[0]?.description
        || checkout.data?.message
        || "Falha ao criar checkout no gateway.";
      return json({ error: msg }, checkout.status || 502);
    }

    const url = checkout.data?.link ?? checkout.data?.url ?? null;
    if (!url) return json({ error: "Checkout criado mas sem URL de pagamento." }, 502);

    return json({ url, checkout_id: checkout.data?.id, mode: paymentMode });
  } catch (e) {
    console.error("create-asaas-checkout error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
