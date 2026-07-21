import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { deleteSubscription, isAsaasConfigured } from "../_shared/asaas.ts";

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
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Sessão expirada." }, 401);

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: userErr } = await supabaseAuth.auth.getUser(authHeader.replace("Bearer ", ""));
    if (userErr || !userData?.user?.email) return json({ error: "Sessão inválida." }, 401);
    const user = userData.user;

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const { data: current } = await service
      .from("subscriptions")
      .select("id, payment_mode, asaas_subscription_id, current_period_end")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    // Cartão recorrente: cancela no Asaas para parar o débito automático
    if (isAsaasConfigured() && current?.payment_mode === "recurring" && current.asaas_subscription_id) {
      try { await deleteSubscription(current.asaas_subscription_id); }
      catch (e) { console.error("delete asaas subscription failed", e); }
    }

    // Marca cancelamento no fim do ciclo (mantém acesso até current_period_end)
    const patch = {
      cancel_at_period_end: true,
      updated_at: new Date().toISOString(),
    };
    if (current?.id) {
      await service.from("subscriptions").update(patch).eq("id", current.id);
    } else {
      await service.from("subscriptions").insert({
        user_id: user.id, plan: "gratuito", status: "canceled", ...patch,
      });
    }

    return json({
      success: true,
      access_until: current?.current_period_end ?? null,
      message: current?.current_period_end
        ? "Cancelado. Você mantém acesso até o fim do ciclo pago."
        : "Cancelado.",
    });
  } catch (e) {
    console.error("cancel-asaas-subscription error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
