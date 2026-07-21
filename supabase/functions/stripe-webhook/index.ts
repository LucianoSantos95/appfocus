import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

// Stripe product → internal plan. Mirrors src/lib/stripe-plans.ts (keep in sync).
const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_UCvvAhvb6yV5Is: "plus", prod_UCvwJONSMfqBgY: "plus",
  prod_UCwJECieX5LR5L: "pro", prod_UCwMJoE6gHRzYl: "pro",
  prod_UCwNnACPlGeYLS: "enterprise", prod_UCwNi4wQNSspnv: "enterprise",
  // Legacy
  prod_U23sAKDoEq8OES: "plus", prod_U23skBVnn0VuO1: "plus",
  prod_U23sma8YXQQIDT: "pro", prod_U23tHVjIomeZla: "pro",
  prod_U23toHCQFVRSOr: "enterprise", prod_U23tKmvlVDm3lS: "enterprise",
};

const log = (step: string, details?: unknown) =>
  console.log(`[STRIPE-WEBHOOK] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
  const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  if (!STRIPE_SECRET_KEY || !WEBHOOK_SECRET) {
    log("Missing Stripe config");
    return new Response("Stripe not configured", { status: 500 });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2025-08-27.basil" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  // Signature verification requires the RAW body.
  const body = await req.text();
  const sig = req.headers.get("stripe-signature") ?? "";
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig, WEBHOOK_SECRET);
  } catch (e) {
    log("Signature verification failed", { msg: e instanceof Error ? e.message : String(e) });
    return new Response("Invalid signature", { status: 400 });
  }

  // Audit trail — every verified event is recorded.
  const { data: logRow } = await admin
    .from("stripe_webhook_events")
    .insert({ type: event.type, status: "received", payload: event.data.object as unknown as Record<string, unknown> })
    .select("id")
    .maybeSingle();
  const logId = logRow?.id;

  const finish = async (status: string, error?: string) => {
    if (logId) {
      await admin.from("stripe_webhook_events")
        .update({ status, error_message: error ?? null, processed_at: new Date().toISOString() })
        .eq("id", logId);
    }
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };

  // Resolve the internal user_id from a Stripe customer (via stored mapping, then e-mail).
  async function resolveUserId(customerId: string | null, clientRef?: string | null): Promise<string | null> {
    if (clientRef) return clientRef;
    if (!customerId) return null;
    const { data: existing } = await admin
      .from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).limit(1).maybeSingle();
    if (existing?.user_id) return existing.user_id as string;
    try {
      const customer = await stripe.customers.retrieve(customerId);
      const email = (customer as Stripe.Customer).email;
      if (email) {
        const { data: users } = await admin.auth.admin.listUsers();
        const match = users?.users?.find((u) => u.email?.toLowerCase() === email.toLowerCase());
        if (match) return match.id;
      }
    } catch (e) {
      log("resolveUserId email fallback failed", { msg: e instanceof Error ? e.message : String(e) });
    }
    return null;
  }

  async function upsertSubscription(userId: string, plan: string, status: string, customerId: string | null, endsAt: string | null) {
    // Update the newest row for this user, or insert if none.
    const { data: current } = await admin
      .from("subscriptions").select("id").eq("user_id", userId).order("created_at", { ascending: false }).limit(1).maybeSingle();
    const patch = { plan, status, stripe_customer_id: customerId, ends_at: endsAt, updated_at: new Date().toISOString() };
    if (current?.id) {
      await admin.from("subscriptions").update(patch).eq("id", current.id);
    } else {
      await admin.from("subscriptions").insert({ user_id: userId, ...patch });
    }
    // Reflect conversion in the funnel + milestone (best-effort).
    if (plan !== "gratuito" && status === "active") {
      await admin.from("user_funnel_stage").update({ stage: "convertido", converted_at: new Date().toISOString() }).eq("user_id", userId);
      await admin.from("user_milestones").insert({ user_id: userId, milestone_key: "upgrade_completed", metadata: { plan } }).select();
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object as Stripe.Checkout.Session;
        const userId = await resolveUserId(s.customer as string | null, s.client_reference_id);
        if (!userId) return finish("error", "user not resolved");
        let plan = "plus";
        let endsAt: string | null = null;
        if (s.subscription) {
          const sub = await stripe.subscriptions.retrieve(s.subscription as string);
          const productId = sub.items.data[0]?.price.product as string;
          plan = PRODUCT_TO_PLAN[productId] ?? "plus";
          if (typeof sub.current_period_end === "number") endsAt = new Date(sub.current_period_end * 1000).toISOString();
        }
        await upsertSubscription(userId, plan, "active", s.customer as string | null, endsAt);
        return finish("processed");
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string | null, (sub.metadata?.user_id as string) || null);
        if (!userId) return finish("error", "user not resolved");
        const productId = sub.items.data[0]?.price.product as string;
        const plan = PRODUCT_TO_PLAN[productId] ?? "plus";
        const active = sub.status === "active" || sub.status === "trialing";
        const endsAt = typeof sub.current_period_end === "number" ? new Date(sub.current_period_end * 1000).toISOString() : null;
        await upsertSubscription(userId, active ? plan : "gratuito", active ? "active" : sub.status, sub.customer as string | null, endsAt);
        return finish("processed");
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        const userId = await resolveUserId(sub.customer as string | null, (sub.metadata?.user_id as string) || null);
        if (!userId) return finish("error", "user not resolved");
        await upsertSubscription(userId, "gratuito", "canceled", sub.customer as string | null, null);
        return finish("processed");
      }

      case "invoice.payment_failed": {
        // Logged for visibility; no state change (Stripe retries automatically).
        return finish("processed");
      }

      default:
        return finish("ignored");
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("Handler error", { type: event.type, msg });
    return finish("error", msg);
  }
});
