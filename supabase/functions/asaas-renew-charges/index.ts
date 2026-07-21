import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { asaas, isAsaasConfigured, PLAN_VALUES } from "../_shared/asaas.ts";

// Job diário: para assinaturas em modo `one_time` que vencem em até 5 dias,
// gera novo checkout DETACHED (Pix/Boleto/Cartão) e salva o link em
// `pending_renewal_url`. Se passou 7 dias do vencimento sem novo pagamento,
// rebaixa para o plano gratuito.

const GRACE_DAYS = 7;
const RENEW_WINDOW_DAYS = 5;

const APP_URL = "https://app.focusinteligente.com.br";

Deno.serve(async (req) => {
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Autoriza somente cron interno via token do vault
  const token = req.headers.get("x-cron-token") ?? new URL(req.url).searchParams.get("token");
  if (token) {
    const admin0 = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
    const { data: ok } = await admin0.rpc("verify_cron_token", { p_token: token });
    if (!ok) return new Response("Unauthorized", { status: 401 });
  } else {
    // Sem token: exige service role no Authorization
    const auth = req.headers.get("Authorization") ?? "";
    if (!auth.includes(SERVICE_ROLE_KEY)) return new Response("Unauthorized", { status: 401 });
  }

  if (!isAsaasConfigured()) return new Response("Asaas not configured", { status: 503 });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  const now = Date.now();
  const renewCutoff = new Date(now + RENEW_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  const graceCutoff = new Date(now - GRACE_DAYS * 24 * 60 * 60 * 1000).toISOString();

  // 1) Downgrade dos que já passaram do período de graça
  const { data: expired } = await admin
    .from("subscriptions")
    .select("id, user_id")
    .eq("payment_mode", "one_time")
    .lt("current_period_end", graceCutoff)
    .neq("plan", "gratuito");

  for (const s of expired ?? []) {
    await admin.from("subscriptions").update({
      plan: "gratuito", status: "canceled",
      pending_renewal_url: null,
      updated_at: new Date().toISOString(),
    }).eq("id", s.id);
  }

  // 2) Renovar os que vencem em breve
  const { data: dueSoon } = await admin
    .from("subscriptions")
    .select("id, user_id, plan, current_period_end, cancel_at_period_end, pending_renewal_url")
    .eq("payment_mode", "one_time")
    .eq("cancel_at_period_end", false)
    .lte("current_period_end", renewCutoff)
    .gte("current_period_end", new Date(now).toISOString())
    .is("pending_renewal_url", null);

  const results: any[] = [];
  for (const s of dueSoon ?? []) {
    if (!s.plan || !PLAN_VALUES[s.plan]) continue;

    // Buscar e-mail do usuário
    const { data: prof } = await admin.from("profiles").select("display_name").eq("user_id", s.user_id).maybeSingle();
    const { data: authUser } = await admin.auth.admin.getUserById(s.user_id);
    const email = authUser?.user?.email;
    if (!email) continue;

    // Ciclo: infere pelo tempo restante (>60d = anual, senão mensal)
    const remaining = new Date(s.current_period_end!).getTime() - now;
    const cycle: "monthly" | "annual" = remaining > 60 * 24 * 60 * 60 * 1000 ? "annual" : "monthly";
    const value = PLAN_VALUES[s.plan][cycle];

    const expiresAt = new Date(now + 7 * 24 * 60 * 60 * 1000).toISOString();
    const checkout = await asaas("/checkouts", "POST", {
      chargeTypes: ["DETACHED"],
      billingTypes: ["PIX", "BOLETO", "CREDIT_CARD"],
      minutesToExpire: 60 * 24 * 7,
      expiresAt,
      dueDateLimitDays: 3,
      callback: {
        successUrl: `${APP_URL}/planos?success=true`,
        cancelUrl: `${APP_URL}/planos?canceled=true`,
        expiredUrl: `${APP_URL}/planos?expired=true`,
      },
      items: [{
        name: `Renovação Hub Empresarial — ${s.plan}`,
        description: `Renovação ${cycle === "annual" ? "anual" : "mensal"} do plano ${s.plan}`,
        quantity: 1,
        value,
      }],
      customerData: { email, name: prof?.display_name ?? email },
      externalReference: `${s.user_id}|${s.plan}|${cycle}|one_time`,
    });

    if (!checkout.ok) { results.push({ user: s.user_id, error: checkout.data }); continue; }
    const url = checkout.data?.link ?? checkout.data?.url ?? null;
    if (!url) continue;

    await admin.from("subscriptions").update({
      pending_renewal_url: url,
      updated_at: new Date().toISOString(),
    }).eq("id", s.id);

    // Notificação in-app
    await admin.from("notifications").insert({
      user_id: s.user_id,
      title: "Hora de renovar seu plano",
      body: `Seu plano ${s.plan} vence em breve. Renove agora via Pix, Boleto ou Cartão.`,
      link: "/planos",
      type: "billing",
    });

    // E-mail via Resend (opcional)
    try {
      const RESEND_KEY = Deno.env.get("RESEND_API_KEY");
      const LOVABLE_KEY = Deno.env.get("LOVABLE_API_KEY");
      const FROM = Deno.env.get("RESEND_FROM_EMAIL") ?? "Hub Empresarial <no-reply@focusinteligente.com.br>";
      if (RESEND_KEY && LOVABLE_KEY) {
        await fetch("https://connector-gateway.lovable.dev/resend/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${LOVABLE_KEY}`,
            "X-Connection-Api-Key": RESEND_KEY,
          },
          body: JSON.stringify({
            from: FROM, to: [email],
            subject: `Renove seu plano ${s.plan} — Pix, Boleto ou Cartão`,
            html: `<p>Olá!</p><p>Seu plano <b>${s.plan}</b> vence em breve. Renove agora escolhendo Pix, Boleto ou Cartão:</p><p><a href="${url}">Renovar agora</a></p><p>Após o pagamento, seu acesso é liberado automaticamente.</p>`,
          }),
        });
      }
    } catch (e) { console.error("email send failed", e); }

    results.push({ user: s.user_id, url });
  }

  return new Response(JSON.stringify({ downgraded: expired?.length ?? 0, renewed: results.length }), {
    headers: { "Content-Type": "application/json" },
  });
});
