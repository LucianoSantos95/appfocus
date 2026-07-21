import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { asaas } from "../_shared/asaas.ts";

const log = (step: string, d?: unknown) => console.log(`[ASAAS-WEBHOOK] ${step}${d ? ` - ${JSON.stringify(d)}` : ""}`);

// Events that mean "money received → grant the plan".
const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
// Events that mean "access should stop".
const LOST_EVENTS = new Set(["SUBSCRIPTION_DELETED", "PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

  // Asaas sends the token you configured in the webhook settings.
  if (WEBHOOK_TOKEN) {
    const sent = req.headers.get("asaas-access-token");
    if (sent !== WEBHOOK_TOKEN) {
      log("Invalid webhook token");
      return new Response("Unauthorized", { status: 401 });
    }
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  let body: any = {};
  try { body = await req.json(); } catch { return new Response("Bad body", { status: 400 }); }

  const event: string = body?.event ?? "";
  const payment = body?.payment ?? {};

  // Audit trail — reuse the payment-events table (also used by Stripe).
  const { data: logRow } = await admin
    .from("stripe_webhook_events")
    .insert({ type: `asaas:${event}`, status: "received", payload: body })
    .select("id").maybeSingle();
  const finish = async (status: string, error?: string) => {
    if (logRow?.id) {
      await admin.from("stripe_webhook_events")
        .update({ status, error_message: error ?? null, processed_at: new Date().toISOString() })
        .eq("id", logRow.id);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  };

  try {
    if (!PAID_EVENTS.has(event) && !LOST_EVENTS.has(event)) return finish("ignored");

    // externalReference is "userId|plan" (set on the subscription; inherited by its payments).
    let ext: string | null = payment.externalReference ?? null;
    if (!ext && payment.subscription) {
      const sub = await asaas(`/subscriptions/${payment.subscription}`);
      ext = sub.ok ? (sub.data?.externalReference ?? null) : null;
    }
    if (!ext || !ext.includes("|")) return finish("error", "externalReference ausente/inválido");
    const [userId, plan] = ext.split("|");
    if (!userId || !plan) return finish("error", "userId/plan não resolvidos");

    const paid = PAID_EVENTS.has(event);
    const newPlan = paid ? plan : "gratuito";
    const newStatus = paid ? "active" : "canceled";

    const { data: current } = await admin
      .from("subscriptions").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const patch = { plan: newPlan, status: newStatus, updated_at: new Date().toISOString() };
    if (current?.id) await admin.from("subscriptions").update(patch).eq("id", current.id);
    else await admin.from("subscriptions").insert({ user_id: userId, ...patch });

    if (paid) {
      await admin.from("user_funnel_stage").update({ stage: "convertido", converted_at: new Date().toISOString() }).eq("user_id", userId);
      await admin.from("user_milestones").insert({ user_id: userId, milestone_key: "upgrade_completed", metadata: { plan, gateway: "asaas" } });
    }

    log("Processed", { event, userId, plan: newPlan });
    return finish("processed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("Handler error", { event, msg });
    return finish("error", msg);
  }
});
