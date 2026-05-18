import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OWNER_EMAIL = "oluciano.dosantos@gmail.com";

const PRODUCT_TO_PLAN: Record<string, string> = {
  prod_UCvvAhvb6yV5Is: "plus",
  prod_UCvwJONSMfqBgY: "plus",
  prod_UCwJECieX5LR5L: "pro",
  prod_UCwMJoE6gHRzYl: "pro",
  prod_UCwNnACPlGeYLS: "enterprise",
  prod_UCwNi4wQNSspnv: "enterprise",
  prod_U23sAKDoEq8OES: "plus",
  prod_U23skBVnn0VuO1: "plus",
  prod_U23sma8YXQQIDT: "pro",
  prod_U23tHVjIomeZla: "pro",
  prod_U23toHCQFVRSOr: "enterprise",
  prod_U23tKmvlVDm3lS: "enterprise",
};

const logStep = (step: string, details?: unknown) => {
  const suffix = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[SYNC-SUBSCRIBERS] ${step}${suffix}`);
};

const toIso = (value: number | string | null | undefined) => {
  if (!value) return null;
  if (typeof value === "number") return new Date(value * 1000).toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } },
  );

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Auth error: ${userError.message}`);

    const currentUser = userData.user;
    if (!currentUser?.id || !currentUser.email) throw new Error("User not authenticated");

    const { data: roleRows, error: roleError } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", currentUser.id)
      .eq("role", "admin");

    if (roleError) throw roleError;

    const isOwner = currentUser.email.toLowerCase() === OWNER_EMAIL;
    const isAdmin = (roleRows?.length ?? 0) > 0;

    if (!isOwner && !isAdmin) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const { data: authUsersPage, error: usersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (usersError) throw usersError;

    const emailToUserId = new Map<string, string>();
    for (const authUser of authUsersPage.users) {
      if (authUser.email) {
        emailToUserId.set(authUser.email.toLowerCase(), authUser.id);
      }
    }

    const activeSubscriptions = await stripe.subscriptions.list({ status: "active", limit: 100 });
    logStep("Active subscriptions fetched", { count: activeSubscriptions.data.length });

    let synced = 0;
    let skipped = 0;

    for (const subscription of activeSubscriptions.data) {
      const customerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

      const customer = await stripe.customers.retrieve(customerId);
      if ("deleted" in customer && customer.deleted) {
        skipped += 1;
        continue;
      }

      const customerEmail = customer.email?.toLowerCase();
      if (!customerEmail) {
        skipped += 1;
        continue;
      }

      const userId = emailToUserId.get(customerEmail);
      if (!userId) {
        skipped += 1;
        continue;
      }

      const productId = subscription.items.data[0]?.price.product;
      const plan = typeof productId === "string" ? PRODUCT_TO_PLAN[productId] : null;
      if (!plan) {
        skipped += 1;
        continue;
      }

      const invoices = await stripe.invoices.list({ customer: customerId, limit: 100 });
      const paidInvoices = invoices.data.filter((invoice) => invoice.status === "paid");
      const ltv = paidInvoices.reduce((sum, invoice) => sum + (invoice.amount_paid ?? 0), 0) / 100;

      const firstPaidInvoice = paidInvoices
        .map((invoice) => invoice.status_transitions.paid_at ?? invoice.created)
        .filter(Boolean)
        .sort((a, b) => (a ?? 0) - (b ?? 0))[0];

      const startedAt = toIso(subscription.start_date) ?? new Date().toISOString();
      const endsAt = toIso(subscription.current_period_end);
      const conversionDate = (toIso(firstPaidInvoice) ?? startedAt).slice(0, 10);

      const { data: existingSubscription } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      const subscriptionPayload = {
        user_id: userId,
        plan,
        status: "active",
        stripe_customer_id: customerId,
        started_at: startedAt,
        ends_at: endsAt,
        updated_at: new Date().toISOString(),
      };

      if (existingSubscription?.id) {
        const { error } = await supabase
          .from("subscriptions")
          .update(subscriptionPayload)
          .eq("id", existingSubscription.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriptions").insert(subscriptionPayload);
        if (error) throw error;
      }

      const { data: existingExtras } = await supabase
        .from("subscriber_extras")
        .select("id, origem, canal_aquisicao, data_conversao")
        .eq("user_id", userId)
        .maybeSingle();

      const extrasPayload = {
        user_id: userId,
        origem: existingExtras?.origem ?? "Assinatura",
        canal_aquisicao: existingExtras?.canal_aquisicao ?? "stripe_checkout",
        data_conversao: existingExtras?.data_conversao ?? conversionDate,
        ltv,
        updated_at: new Date().toISOString(),
      };

      if (existingExtras?.id) {
        const { error } = await supabase
          .from("subscriber_extras")
          .update(extrasPayload)
          .eq("id", existingExtras.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("subscriber_extras").insert(extrasPayload);
        if (error) throw error;
      }

      synced += 1;
    }

    return new Response(JSON.stringify({ synced, skipped, total_active: activeSubscriptions.data.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message });
    const isAuthError = message.includes("Auth error") || message.includes("JWT") || message.includes("token");

    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: isAuthError ? 401 : 500,
    });
  }
});