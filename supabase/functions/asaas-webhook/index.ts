import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { asaas } from "../_shared/asaas.ts";
import { enviarEmailEntrega } from "../_shared/entrega-email.ts";

const log = (step: string, d?: unknown) => console.log(`[ASAAS-WEBHOOK] ${step}${d ? ` - ${JSON.stringify(d)}` : ""}`);

const PAID_EVENTS = new Set(["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED"]);
const LOST_EVENTS = new Set(["PAYMENT_REFUNDED", "PAYMENT_CHARGEBACK_REQUESTED"]);
const OVERDUE_EVENTS = new Set(["PAYMENT_OVERDUE"]);
const SUB_DELETED = new Set(["SUBSCRIPTION_DELETED"]);

function computePeriodEnd(cycle: string): string {
  const ms = cycle === "annual" ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
  return new Date(Date.now() + ms).toISOString();
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN");

  // Fail closed: sem segredo configurado, ninguém entra.
  if (!WEBHOOK_TOKEN) {
    log("ASAAS_WEBHOOK_TOKEN not configured — rejecting request");
    return new Response("Unauthorized", { status: 401 });
  }
  if (req.headers.get("asaas-access-token") !== WEBHOOK_TOKEN) {
    log("Invalid webhook token");
    return new Response("Unauthorized", { status: 401 });
  }


  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  let body: any = {};
  try { body = await req.json(); } catch { return new Response("Bad body", { status: 400 }); }

  const event: string = body?.event ?? "";
  const payment = body?.payment ?? {};
  const subscriptionPayload = body?.subscription ?? {};

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
    const isPaid = PAID_EVENTS.has(event);
    const isLost = LOST_EVENTS.has(event);
    const isOverdue = OVERDUE_EVENTS.has(event);
    const isSubDeleted = SUB_DELETED.has(event);
    if (!isPaid && !isLost && !isOverdue && !isSubDeleted) return finish("ignored");

    // externalReference: user|plan|cycle|mode  (mode/cycle podem faltar em registros antigos)
    let ext: string | null = payment.externalReference ?? subscriptionPayload.externalReference ?? null;
    if (!ext && payment.subscription) {
      const sub = await asaas(`/subscriptions/${payment.subscription}`);
      ext = sub.ok ? (sub.data?.externalReference ?? null) : null;
    }
    if (!ext || !ext.includes("|")) return finish("error", "externalReference ausente/inválido");

    // Compra avulsa de produto do catálogo: produto|<id da compra>
    if (ext.startsWith("produto|")) {
      const compraId = ext.split("|")[1];
      const { data: compra } = await admin
        .from("compras").select("id, status, email, nome, produto_slug, produto_nome, token_acesso")
        .eq("id", compraId).maybeSingle();
      if (!compra) return finish("error", "compra não encontrada");

      if (isLost) {
        await admin.from("compras").update({ status: "estornado", liberado_em: null }).eq("id", compra.id);
        log("Compra estornada", { compraId });
        return finish("processed");
      }
      if (!isPaid) return finish("ignored");
      if (compra.status === "pago") return finish("ignored");

      await admin.from("compras").update({
        status: "pago",
        liberado_em: new Date().toISOString(),
        asaas_payment_id: payment.id ?? null,
        billing_type: payment.billingType ?? null,
      }).eq("id", compra.id);

      const { data: prod } = await admin
        .from("produtos").select("nome")
        .eq("slug", compra.produto_slug).maybeSingle();
      const { data: entrega } = await admin
        .from("produto_entregas").select("link")
        .eq("produto_slug", compra.produto_slug).maybeSingle();

      await enviarEmailEntrega(admin, {
        email: compra.email,
        nome: compra.nome,
        produtoNome: compra.produto_nome ?? prod?.nome ?? "seu produto",
        produtoSlug: compra.produto_slug,
        // Só o link de entrega configurado: link_destino de produto pago pode
        // guardar o link antigo de pagamento e mandaria o cliente pagar de novo.
        linkEntrega: entrega?.link ?? null,
        tokenAcesso: compra.token_acesso,
      }).catch((e) => log("Falha no e-mail de entrega", { msg: String(e) }));

      log("Compra liberada", { compraId, produto: compra.produto_slug });
      return finish("processed");
    }

    const parts = ext.split("|");
    const [userId, plan, cycle = "monthly", mode = "recurring"] = parts;
    if (!userId || !plan) return finish("error", "userId/plan não resolvidos");

    // Buscar/criar linha de assinatura
    const { data: current } = await admin
      .from("subscriptions").select("id, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    let patch: Record<string, unknown> = { updated_at: new Date().toISOString() };

    if (isPaid) {
      patch = {
        ...patch,
        plan,
        status: "active",
        payment_mode: mode,
        current_period_end: computePeriodEnd(cycle),
        last_payment_id: payment.id ?? null,
        pending_renewal_url: null,
        asaas_subscription_id: payment.subscription ?? subscriptionPayload.id ?? null,
      };
    } else if (isOverdue) {
      patch = { ...patch, status: "past_due" };
    } else if (isSubDeleted) {
      // Cancela ciclo recorrente ao fim do período
      patch = { ...patch, cancel_at_period_end: true };
    } else {
      // refund / chargeback → derruba imediatamente
      patch = { ...patch, plan: "gratuito", status: "canceled", current_period_end: new Date().toISOString() };
    }

    if (current?.id) await admin.from("subscriptions").update(patch).eq("id", current.id);
    else await admin.from("subscriptions").insert({ user_id: userId, ...patch });

    if (isPaid) {
      await admin.from("user_funnel_stage").update({ stage: "convertido", converted_at: new Date().toISOString() }).eq("user_id", userId);
      await admin.from("user_milestones").insert({ user_id: userId, milestone_key: "upgrade_completed", metadata: { plan, gateway: "asaas", mode } });
    }

    log("Processed", { event, userId, plan, mode });
    return finish("processed");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    log("Handler error", { event, msg });
    return finish("error", msg);
  }
});
