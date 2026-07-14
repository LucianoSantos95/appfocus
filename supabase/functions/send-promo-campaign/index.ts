// Admin-only campaign dispatcher: sends 1 of 2 promo emails to engaged free users
// or inactive users, segmented from vw_user_engagement. Idempotent via email_send_log.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://app.focusinteligente.com.br";
const VERIFIED_FROM_EMAIL = "Hub Empresarial <noreply@app.focusinteligente.com.br>";
const COUPON_ID = "LkKmwwQE"; // Stripe coupon: 20% off por 3 meses
const COUPON_LABEL = "20% OFF por 3 meses";
const PUBLIC_EMAIL_DOMAINS = [
  "gmail.com",
  "googlemail.com",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "yahoo.com",
  "yahoo.com.br",
  "icloud.com",
  "me.com",
  "uol.com.br",
  "bol.com.br",
  "terra.com.br",
];

const TEMPLATES = {
  engaged: {
    template_name: "promo_engaged_20off",
    subject: "🎁 Um presente para você: 20% OFF por 3 meses no Hub",
    cta_url: `${SITE_URL}/planos?coupon=${COUPON_ID}`,
  },
  inactive: {
    template_name: "promo_inactive_reactivation",
    subject: "✨ Novidades chegaram no Hub — e tem uma surpresa para você",
    cta_url: `${SITE_URL}/onboarding`,
  },
} as const;

function renderEngaged(displayName: string | null) {
  const greeting = displayName ? `Olá, ${escapeHtml(displayName)}!` : "Olá!";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8ecf3">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a"><tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#111827 0%,#0a0e1a 100%);border:1px solid #1f2937;border-radius:16px;overflow:hidden">
<tr><td style="padding:32px 36px 0">
  <div style="font-size:13px;letter-spacing:2px;color:#3b82f6;font-weight:700;text-transform:uppercase">FOCUS · Hub Empresarial</div>
</td></tr>
<tr><td style="padding:28px 36px 8px">
  <h1 style="margin:0;font-size:28px;line-height:1.2;color:#fff;font-weight:800">${greeting}</h1>
  <p style="margin:14px 0 0;font-size:16px;color:#9ca3af;line-height:1.6">
    Notamos que você tem usado o Hub Empresarial — e estamos felizes em ter você por aqui.
  </p>
</td></tr>
<tr><td style="padding:28px 36px">
  <div style="background:linear-gradient(135deg,#1e3a8a 0%,#3b82f6 100%);border-radius:12px;padding:24px;text-align:center">
    <div style="font-size:13px;color:#bfdbfe;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">Oferta exclusiva</div>
    <div style="font-size:42px;font-weight:900;color:#fff;margin:8px 0;line-height:1">20% OFF</div>
    <div style="font-size:15px;color:#dbeafe">durante 3 meses em qualquer plano pago</div>
  </div>
</td></tr>
<tr><td style="padding:0 36px 8px">
  <p style="margin:0;font-size:15px;color:#cbd5e1;line-height:1.6">
    Como cortesia pelo seu engajamento, liberamos um cupom para você desbloquear todos os recursos do Hub:
  </p>
  <ul style="margin:14px 0;padding-left:20px;color:#9ca3af;font-size:14px;line-height:1.9">
    <li>Registros ilimitados em todos os módulos</li>
    <li>Análise de clientes com IA</li>
    <li>Importação de planilhas e exportação de relatórios</li>
    <li>Suporte prioritário</li>
  </ul>
</td></tr>
<tr><td align="center" style="padding:20px 36px 32px">
  <a href="${TEMPLATES.engaged.cta_url}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 36px;border-radius:12px;box-shadow:0 8px 24px rgba(59,130,246,.4)">
    Ativar meu cupom de 20% OFF →
  </a>
  <p style="margin:14px 0 0;font-size:12px;color:#6b7280">O cupom é aplicado automaticamente no checkout.</p>
</td></tr>
<tr><td style="padding:24px 36px;border-top:1px solid #1f2937">
  <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">
    Você está recebendo este e-mail porque tem uma conta ativa no Hub Empresarial.<br/>
    Dúvidas? Responda este e-mail — estamos aqui para ajudar.
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function renderInactive(displayName: string | null) {
  const greeting = displayName ? `${escapeHtml(displayName)}, sentimos sua falta!` : "Sentimos sua falta!";
  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8ecf3">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a"><tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#111827 0%,#0a0e1a 100%);border:1px solid #1f2937;border-radius:16px;overflow:hidden">
<tr><td style="padding:32px 36px 0">
  <div style="font-size:13px;letter-spacing:2px;color:#3b82f6;font-weight:700;text-transform:uppercase">FOCUS · Hub Empresarial</div>
</td></tr>
<tr><td style="padding:28px 36px 8px">
  <h1 style="margin:0;font-size:28px;line-height:1.2;color:#fff;font-weight:800">${greeting}</h1>
  <p style="margin:14px 0 0;font-size:16px;color:#9ca3af;line-height:1.6">
    Faz um tempo que você não passa por aqui — e o Hub está com novidades importantes para a sua operação.
  </p>
</td></tr>
<tr><td style="padding:28px 36px 8px">
  <h2 style="margin:0 0 14px;font-size:18px;color:#fff;font-weight:700">✨ O que mudou:</h2>
  <div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px;margin-bottom:10px">
    <strong style="color:#3b82f6;font-size:14px">🤖 Assistente IA do Hub</strong>
    <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5">Pergunte sobre seus dados em linguagem natural — finanças, clientes, projetos.</p>
  </div>
  <div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px;margin-bottom:10px">
    <strong style="color:#3b82f6;font-size:14px">🎙️ Gravação de reuniões com IA</strong>
    <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5">Grave conversas com clientes e receba transcrição + próximos passos automaticamente.</p>
  </div>
  <div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px">
    <strong style="color:#3b82f6;font-size:14px">📊 BI Dashboards e Relatórios</strong>
    <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5">Métricas avançadas em cada módulo + envio automático por e-mail.</p>
  </div>
</td></tr>
<tr><td style="padding:24px 36px">
  <div style="background:linear-gradient(135deg,#7c3aed 0%,#3b82f6 100%);border-radius:12px;padding:22px;text-align:center">
    <div style="font-size:13px;color:#e9d5ff;text-transform:uppercase;letter-spacing:1.5px;font-weight:600">🎁 Surpresa esperando você</div>
    <div style="font-size:18px;font-weight:700;color:#fff;margin:8px 0;line-height:1.4">
      Conclua seu onboarding e ganhe<br/><span style="font-size:24px">20% OFF por 3 meses</span>
    </div>
    <div style="font-size:13px;color:#ddd6fe">em qualquer plano pago do Hub</div>
  </div>
</td></tr>
<tr><td align="center" style="padding:8px 36px 32px">
  <a href="${TEMPLATES.inactive.cta_url}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 36px;border-radius:12px;box-shadow:0 8px 24px rgba(59,130,246,.4)">
    Voltar ao Hub e ganhar minha surpresa →
  </a>
  <p style="margin:14px 0 0;font-size:12px;color:#6b7280">Leva menos de 3 minutos.</p>
</td></tr>
<tr><td style="padding:24px 36px;border-top:1px solid #1f2937">
  <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">
    Você está recebendo este e-mail porque tem uma conta no Hub Empresarial.<br/>
    Não quer mais receber? Responda este e-mail com "remover".
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function resolveFromEmail() {
  const rawFrom = Deno.env.get("RESEND_FROM_EMAIL")?.trim();
  const match = rawFrom?.match(/<?([^<>\s@]+@([^<>\s]+))>?$/);
  const domain = match?.[2]?.toLowerCase();
  const isPublicDomain = domain ? PUBLIC_EMAIL_DOMAINS.includes(domain) : false;

  if (rawFrom && isPublicDomain) {
    console.warn(
      `[send-promo-campaign] RESEND_FROM_EMAIL ignorado (domínio público "${domain}"). Usando remetente verificado.`,
    );
  }

  return rawFrom && !isPublicDomain ? rawFrom : VERIFIED_FROM_EMAIL;
}

interface Body {
  segment: "engaged" | "inactive";
  dryRun?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const resendKey = Deno.env.get("RESEND_API_KEY");

  try {
    // Auth: must be admin
    const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
    if (!auth) return json({ error: "unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });
    const { data: userData, error: userErr } = await supabase.auth.getUser(auth);
    if (userErr || !userData.user) return json({ error: "unauthorized" }, 401);

    // Admin-only via user_roles table
    const { data: roleRows, error: roleErr } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id)
      .eq("role", "admin");
    if (roleErr || !roleRows || roleRows.length === 0) {
      return json({ error: "forbidden" }, 403);
    }

    const body = (await req.json()) as Body;
    if (!body.segment || !["engaged", "inactive"].includes(body.segment)) {
      return json({ error: "invalid segment" }, 400);
    }
    const tpl = TEMPLATES[body.segment];

    // Segment from vw_user_engagement (without email — view can't expose auth.users to service_role)
    let query = supabase.from("vw_user_engagement" as any).select("user_id, display_name, plan, classificacao");
    if (body.segment === "engaged") {
      query = query.eq("classificacao", "casual").eq("plan", "gratuito");
    } else {
      query = query.eq("classificacao", "inativo").eq("plan", "gratuito");
    }
    const { data: targets, error: tErr } = await query;
    if (tErr) throw tErr;

    // Resolve emails via auth admin API
    const targetIds = new Set(((targets as any[]) || []).map((t) => t.user_id));
    const emailMap = new Map<string, string>();
    let page = 1;
    while (true) {
      const { data: list, error: lErr } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
      if (lErr) throw lErr;
      for (const u of list.users) {
        if (targetIds.has(u.id) && u.email) emailMap.set(u.id, u.email);
      }
      if (list.users.length < 1000) break;
      page++;
      if (page > 20) break; // safety
    }

    const recipients = ((targets as any[]) || [])
      .map((t) => ({ ...t, email: emailMap.get(t.user_id) }))
      .filter((t) => t.email);

    if (body.dryRun) {
      return json({
        segment: body.segment,
        template: tpl.template_name,
        subject: tpl.subject,
        total_recipients: recipients.length,
        sample: recipients.slice(0, 5).map((r) => ({ email: r.email, name: r.display_name })),
      });
    }

    if (!resendKey) return json({ error: "RESEND_API_KEY missing" }, 500);
    const fromEmail = resolveFromEmail();

    // Idempotency: skip only recipients with a successful prior send for this template
    const emails = recipients.map((r) => r.email);
    const { data: prior } = await supabase
      .from("email_send_log")
      .select("recipient_email, status")
      .eq("template_name", tpl.template_name)
      .eq("status", "sent")
      .in("recipient_email", emails);
    const alreadySent = new Set((prior || []).map((p: any) => p.recipient_email));
    const toSend = recipients.filter((r) => !alreadySent.has(r.email));

    const results = { sent: 0, failed: 0, skipped: alreadySent.size, errors: [] as any[] };
    const { sendResendEmail } = await import("../_shared/resend.ts");
    for (const r of toSend) {
      const html = body.segment === "engaged" ? renderEngaged(r.display_name) : renderInactive(r.display_name);
      try {
        const result = await sendResendEmail({
          from: fromEmail,
          to: r.email,
          subject: tpl.subject,
          html,
        });
        if (!result.ok) {
          results.failed++;
          results.errors.push({ email: r.email, error: result.error });
          await supabase.from("email_send_log").insert({
            template_name: tpl.template_name,
            recipient_email: r.email,
            status: "failed",
            error_message: (result.error ?? "unknown").slice(0, 500),
            metadata: { segment: body.segment, user_id: r.user_id },
          });
        } else {
          results.sent++;
          await supabase.from("email_send_log").insert({
            message_id: result.id,
            template_name: tpl.template_name,
            recipient_email: r.email,
            status: "sent",
            metadata: { segment: body.segment, user_id: r.user_id, coupon: body.segment === "engaged" ? COUPON_ID : null },
          });
        }
        // gentle pacing for Resend (10/sec limit)
        await new Promise((res) => setTimeout(res, 120));
      } catch (e) {
        results.failed++;
        results.errors.push({ email: r.email, error: String(e) });
      }
    }


    return json({ segment: body.segment, total: recipients.length, ...results });
  } catch (e) {
    console.error("send-promo-campaign error", e);
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});

function json(body: any, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
