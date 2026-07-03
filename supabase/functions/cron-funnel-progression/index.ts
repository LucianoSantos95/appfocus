// Recomputes funnel stage for all non-converted users and enqueues nudges for hot leads.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } }
  );

  const log = (msg: string, extra?: unknown) =>
    console.log(`[cron-funnel-progression] ${msg}${extra ? " " + JSON.stringify(extra) : ""}`);

  try {
    log("started");

    // Every non-converted user
    const { data: rows, error } = await supabase
      .from("user_funnel_stage")
      .select("user_id, stage")
      .not("stage", "in", "(convertido,churn)");
    if (error) throw error;

    let recomputed = 0;
    let becameHot = 0;
    const hotUsers: string[] = [];

    for (const row of rows ?? []) {
      const { data: updated, error: rpcErr } = await supabase.rpc("recompute_funnel_stage", {
        p_user_id: row.user_id,
      });
      if (rpcErr) {
        log("recompute failed", { user_id: row.user_id, error: rpcErr.message });
        continue;
      }
      recomputed++;
      if (updated && (updated as { stage?: string }).stage === "quente" && row.stage !== "quente") {
        becameHot++;
        hotUsers.push(row.user_id);
      }
    }

    // Nudge (email + touchpoint) for users that just turned hot
    let nudged = 0;
    for (const uid of hotUsers) {
      // Skip if we already nudged in the last 3 days
      const { count: recent } = await supabase
        .from("sales_touchpoints")
        .select("id", { count: "exact", head: true })
        .eq("user_id", uid)
        .eq("channel", "system")
        .eq("reason", "hot_lead_nudge")
        .gte("created_at", new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString());
      if ((recent ?? 0) > 0) continue;

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("user_id", uid)
        .maybeSingle();
      const { data: authUser } = await supabase.auth.admin.getUserById(uid);
      const email = authUser?.user?.email;
      if (!email) continue;

      // Log touchpoint (system nudge)
      await supabase.from("sales_touchpoints").insert({
        user_id: uid,
        channel: "system",
        reason: "hot_lead_nudge",
        outcome: "email_queued",
        metadata: { source: "cron-funnel-progression" },
      });

      // Notification in-app
      await supabase.from("notifications").insert({
        user_id: uid,
        title: "🎯 Você está pronto para escalar",
        message: `${profile?.display_name ?? "Olá"}, sua operação está bombando! Aproveite 20% OFF com o cupom ONBOARDING20 no upgrade para o Plus.`,
        type: "upgrade_nudge",
      }).catch(() => null);

      nudged++;
    }

    log("finished", { recomputed, becameHot, nudged });
    return new Response(
      JSON.stringify({ ok: true, recomputed, became_hot: becameHot, nudged }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[cron-funnel-progression] ERROR", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
