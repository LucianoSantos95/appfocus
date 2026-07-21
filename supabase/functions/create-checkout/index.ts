import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const log = (step: string, details?: unknown) => {
  const extra = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[CREATE-CHECKOUT] ${step}${extra}`);
};

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status,
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    log("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      log("Missing STRIPE_SECRET_KEY");
      return json({ error: "Configuração de pagamento ausente. Contate o suporte." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? req.headers.get("authorization");
    if (!authHeader) {
      log("Missing Authorization header");
      return json({ error: "Sessão expirada. Faça login novamente para continuar." }, 401);
    }
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ error: "Sessão inválida. Faça login novamente." }, 401);
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const { data: userData, error: userErr } = await supabaseClient.auth.getUser(token);
    if (userErr) {
      log("Auth error", { message: userErr.message });
      return json({ error: "Não foi possível validar sua sessão. Faça login novamente." }, 401);
    }
    const user = userData.user;
    if (!user?.email) {
      return json({ error: "Usuário sem e-mail válido." }, 400);
    }
    log("User authenticated", { userId: user.id, email: user.email });

    let body: any = {};
    try {
      body = await req.json();
    } catch {
      return json({ error: "Body JSON inválido." }, 400);
    }

    const { priceId, couponId, promotionCode } = body ?? {};
    if (!priceId || typeof priceId !== "string") {
      return json({ error: "priceId é obrigatório." }, 400);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    // Validate price exists and is active before creating the session
    try {
      const price = await stripe.prices.retrieve(priceId);
      if (!price.active) {
        log("Inactive price", { priceId });
        return json({ error: "Este plano está temporariamente indisponível. Tente outro." }, 400);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      log("Price retrieve error", { priceId, msg });
      return json({ error: "Plano inválido. Recarregue a página e tente novamente." }, 400);
    }

    let customerId: string | undefined;
    try {
      const customers = await stripe.customers.list({ email: user.email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    } catch (e) {
      log("Customer list error", { msg: e instanceof Error ? e.message : String(e) });
      // non-fatal — let Stripe create one via customer_email
    }

    const ALLOWED_ORIGINS = [
      "https://app.focusinteligente.com.br",
      "https://appfocus.lovable.app",
      "https://id-preview--7b5ec06c-73e1-4b8a-b8c6-b0355f0a1aa9.lovable.app",
    ];
    const requestOrigin = req.headers.get("origin") ?? "";
    const origin = ALLOWED_ORIGINS.includes(requestOrigin)
      ? requestOrigin
      : ALLOWED_ORIGINS[0];

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "subscription",
      payment_method_types: ["card", "boleto"],
      // Link the payment back to the internal user so the webhook can upgrade the right account.
      client_reference_id: user.id,
      subscription_data: {
        metadata: { user_id: user.id },
        trial_period_days: 7,
        trial_settings: {
          end_behavior: { missing_payment_method: "pause" },
        },
      },
      success_url: `${origin}/planos?success=true`,
      cancel_url: `${origin}/planos?canceled=true`,
    };


    if (promotionCode && typeof promotionCode === "string") {
      sessionParams.discounts = [{ promotion_code: promotionCode }];
    } else if (couponId && typeof couponId === "string") {
      sessionParams.discounts = [{ coupon: couponId }];
    } else {
      sessionParams.allow_promotion_codes = true;
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      log("Checkout session created", { id: session.id });
      return json({ url: session.url }, 200);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Stripe session create error", msg);
      log("Stripe session create error", { msg });
      return json({ error: "Erro ao iniciar o pagamento. Tente novamente em instantes." }, 502);
    }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("create-checkout unhandled error", msg);
    log("Unhandled error", { msg });
    return json({ error: "Erro interno. Tente novamente." }, 500);
  }
});
