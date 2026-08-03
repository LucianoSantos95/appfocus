// Admin-only broadcast email to all subscribers or only free-plan ones.
// Personaliza por destinatário (nome) e usa o mesmo template visual dos
// e-mails de Reativação / 20% OFF (send-promo-campaign).
//
// Actions:
//   - { action: "preview", audience, topic? }      -> IA gera body modular + retorna contagem
//   - { action: "send",    audience, subject, intro_html, blocks_html, cta_label, cta_url, body_text? }
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SITE_URL = "https://app.focusinteligente.com.br";

const RAW_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "";
const FALLBACK_FROM = "Hub Empresarial <noreply@app.focusinteligente.com.br>";
const PUBLIC_DOMAINS = /@(gmail|hotmail|outlook|live|yahoo|icloud|proton(?:mail)?)\.[a-z.]+>?\s*$/i;
const FROM_EMAIL = RAW_FROM && !PUBLIC_DOMAINS.test(RAW_FROM) ? RAW_FROM : FALLBACK_FROM;

type Audience = "all" | "free" | "recent";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

function safeHttpUrl(url: string, fallback: string): string {
  try {
    const u = new URL(url);
    if (u.protocol === "http:" || u.protocol === "https:") return u.toString();
  } catch { /* ignore */ }
  return fallback;
}

function firstName(name: string | null | undefined): string | null {
  if (!name) return null;
  const trimmed = name.trim();
  if (!trimmed || trimmed.includes("@")) return null;
  return trimmed.split(/\s+/)[0];
}

// Mesma identidade visual de send-promo-campaign
function renderTemplate(opts: {
  displayName: string | null;
  greetingTone: "welcome" | "reengage";
  introHtml: string; // <p>...</p>
  blocksHtml: string; // cards/listas/destaques
  ctaLabel: string;
  ctaUrl: string;
  footerNote?: string;
}) {
  const name = firstName(opts.displayName);
  const greeting = opts.greetingTone === "reengage"
    ? (name ? `${escapeHtml(name)}, temos novidades para você` : "Temos novidades para você")
    : (name ? `Olá, ${escapeHtml(name)}!` : "Olá!");

  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8ecf3">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a"><tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#111827 0%,#0a0e1a 100%);border:1px solid #1f2937;border-radius:16px;overflow:hidden">
<tr><td style="padding:32px 36px 0">
  <div style="font-size:13px;letter-spacing:2px;color:#3b82f6;font-weight:700;text-transform:uppercase">FOCUS · Hub Empresarial</div>
</td></tr>
<tr><td style="padding:28px 36px 8px">
  <h1 style="margin:0;font-size:28px;line-height:1.2;color:#fff;font-weight:800">${greeting}</h1>
  <div style="margin:14px 0 0;font-size:16px;color:#cbd5e1;line-height:1.6">${opts.introHtml}</div>
</td></tr>
<tr><td style="padding:20px 36px 8px">
  ${opts.blocksHtml}
</td></tr>
<tr><td align="center" style="padding:20px 36px 32px">
  <a href="${escapeHtml(safeHttpUrl(opts.ctaUrl, `${SITE_URL}/`))}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 36px;border-radius:12px;box-shadow:0 8px 24px rgba(59,130,246,.4)">
    ${escapeHtml(opts.ctaLabel)} →
  </a>
</td></tr>
<tr><td style="padding:24px 36px;border-top:1px solid #1f2937">
  <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">
    ${opts.footerNote || "Você está recebendo este e-mail porque tem uma conta no Hub Empresarial."}<br/>
    Dúvidas? Responda este e-mail — estamos aqui para ajudar.<br/>
    <span style="color:#4b5563">— Equipe Focus</span>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

async function listRecipients(admin: any, audience: Audience, limit = 70) {
  let userIds: string[] = [];
  const nameMap = new Map<string, string | null>();

  if (audience === "recent") {
    // Últimos N cadastrados (profiles ordenados por created_at)
    const { data: profs, error } = await admin
      .from("profiles")
      .select("user_id, display_name, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);
    if (error) throw error;
    for (const p of profs ?? []) {
      userIds.push(p.user_id);
      nameMap.set(p.user_id, p.display_name);
    }
  } else {
    let q = admin.from("subscriptions").select("user_id, plan");
    if (audience === "free") q = q.eq("plan", "gratuito");
    const { data: subs, error } = await q;
    if (error) throw error;
    userIds = (subs ?? []).map((s: any) => s.user_id);
    if (userIds.length > 0) {
      const { data: profs } = await admin
        .from("profiles")
        .select("user_id, display_name")
        .in("user_id", userIds);
      for (const p of profs ?? []) nameMap.set(p.user_id, p.display_name);
    }
  }

  const recipients: Array<{ user_id: string; email: string; display_name: string | null }> = [];
  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const emailMap = new Map<string, string>();
  for (const u of usersPage?.users ?? []) {
    if (u.email) emailMap.set(u.id, u.email);
  }

  for (const uid of userIds) {
    const email = emailMap.get(uid);
    if (email) recipients.push({ user_id: uid, email, display_name: nameMap.get(uid) ?? null });
  }


  const emails = recipients.map((r) => r.email);
  if (emails.length === 0) return [];
  const { data: suppressed } = await admin
    .from("suppressed_emails")
    .select("email")
    .in("email", emails);
  const suppressedSet = new Set((suppressed ?? []).map((s: any) => s.email));
  return recipients.filter((r) => !suppressedSet.has(r.email));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing Authorization" });

    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json(401, { error: "Unauthorized" });
    const caller = userData.user;

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json(403, { error: "Admin only" });

    const body = await req.json();
    const action = body?.action as string;
    const audience: Audience = body?.audience === "free" ? "free" : "all";

    if (action === "preview") {
      const recipients = await listRecipients(admin, audience);
      const topic = (body?.topic as string) || "";

      const audienceBrief = audience === "free"
        ? "usuários do plano GRATUITO do Focus (Hub Empresarial). Reforce valor e incentive upgrade para o plano Plus."
        : "TODA a base de assinantes do Focus (Hub Empresarial — gestão para agências, freelancers e PMEs). Comunique novidades e reforce relacionamento.";

      const defaultCta = audience === "free"
        ? `${SITE_URL}/planos`
        : `${SITE_URL}/`;

      const prompt = `Você é um copywriter sênior B2B SaaS em PT-BR. Escreva um e-mail de broadcast personalizado para ${audienceBrief}

${topic ? `Tópico/ângulo do admin: "${topic}"` : "Sem tópico específico — proponha algo relevante."}

Tom humano, direto, brasileiro. NÃO inclua saudação ("Olá") nem assinatura — o template já cuida disso.
NÃO escreva o nome do destinatário no corpo (já é tratado pelo template).

Responda APENAS JSON válido (sem markdown), no formato:
{
  "subject": "linha de assunto curta com emoji opcional",
  "greeting_tone": "welcome" | "reengage",
  "intro_html": "<p>1-2 parágrafos curtos abrindo a conversa, sem mencionar o nome</p>",
  "blocks_html": "HTML com até 3 cards no padrão: <div style=\\"background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px;margin-bottom:10px\\"><strong style=\\"color:#3b82f6;font-size:14px\\">🎯 Título</strong><p style=\\"margin:6px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5\\">descrição</p></div>. Opcionalmente inclua um destaque de oferta com gradiente.",
  "cta_label": "texto curto do botão (sem seta)",
  "cta_url": "${defaultCta}",
  "body_text": "versão texto puro equivalente, sem HTML"
}`;

      const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            { role: "system", content: "Você responde estritamente com JSON válido." },
            { role: "user", content: prompt },
          ],
        }),
      });
      if (!aiRes.ok) {
        const txt = await aiRes.text();
        console.error("AI gateway error", aiRes.status, txt);
        if (aiRes.status === 429) return json(429, { error: "rate_limited" });
        if (aiRes.status === 402) return json(402, { error: "credits_exhausted" });
        return json(500, { error: "AI generation failed" });
      }
      const aiJson = await aiRes.json();
      let content: string = aiJson?.choices?.[0]?.message?.content ?? "{}";
      content = content.replace(/^```json\s*|\s*```$/g, "").trim();
      let parsed: any;
      try { parsed = JSON.parse(content); } catch {
        return json(500, { error: "AI returned invalid JSON", raw: content });
      }

      // Preview HTML usando primeiro destinatário (para o admin ver como fica personalizado)
      const sampleRecipient = recipients[0];
      const previewHtml = renderTemplate({
        displayName: sampleRecipient?.display_name ?? null,
        greetingTone: parsed.greeting_tone === "reengage" ? "reengage" : "welcome",
        introHtml: String(parsed.intro_html || ""),
        blocksHtml: String(parsed.blocks_html || ""),
        ctaLabel: String(parsed.cta_label || "Acessar o Hub"),
        ctaUrl: String(parsed.cta_url || defaultCta),
      });

      return json(200, {
        audience,
        total_recipients: recipients.length,
        sample: recipients.slice(0, 5).map((r) => r.email),
        subject: String(parsed.subject || ""),
        greeting_tone: parsed.greeting_tone === "reengage" ? "reengage" : "welcome",
        intro_html: String(parsed.intro_html || ""),
        blocks_html: String(parsed.blocks_html || ""),
        cta_label: String(parsed.cta_label || "Acessar o Hub"),
        cta_url: String(parsed.cta_url || defaultCta),
        body_text: String(parsed.body_text || ""),
        preview_html: previewHtml,
      });
    }

    if (action === "send") {
      const subject = String(body?.subject || "").trim();
      const introHtml = String(body?.intro_html || "").trim();
      const blocksHtml = String(body?.blocks_html || "").trim();
      const ctaLabel = String(body?.cta_label || "Acessar o Hub").trim();
      const ctaUrl = safeHttpUrl(String(body?.cta_url || `${SITE_URL}/`).trim(), `${SITE_URL}/`);
      const greetingTone = body?.greeting_tone === "reengage" ? "reengage" : "welcome";
      const bodyText = String(body?.body_text || "").trim();
      if (!subject || !introHtml) return json(400, { error: "subject and intro_html required" });

      const recipients = await listRecipients(admin, audience);
      let sent = 0;
      let failed = 0;

      for (const r of recipients) {
        try {
          // Render personalizado por destinatário
          const html = renderTemplate({
            displayName: r.display_name,
            greetingTone,
            introHtml,
            blocksHtml,
            ctaLabel,
            ctaUrl,
          });
          const personalizedText = (firstName(r.display_name)
            ? `Olá, ${firstName(r.display_name)}!\n\n`
            : "") + bodyText;

          const { sendResendEmail } = await import("../_shared/resend.ts");
          const result = await sendResendEmail({
            from: FROM_EMAIL,
            to: r.email,
            subject,
            html,
            text: personalizedText || undefined,
          });
          if (!result.ok) {
            failed++;
            await admin.from("email_send_log").insert({
              recipient_email: r.email,
              status: "failed",
              template_name: "subscriber_broadcast",
              error_message: (result.error ?? "unknown").slice(0, 500),
              metadata: { audience },
            });
          } else {
            sent++;
            await admin.from("email_send_log").insert({
              recipient_email: r.email,
              status: "sent",
              template_name: "subscriber_broadcast",
              message_id: result.id ?? null,
              metadata: { audience },
            });
          }

          await new Promise((res) => setTimeout(res, 150));
        } catch (e) {
          failed++;
          console.error("broadcast send error", r.email, e);
        }
      }

      return json(200, { ok: true, sent, failed, total: recipients.length, audience });
    }

    return json(400, { error: "Unknown action" });
  } catch (e) {
    console.error("send-subscriber-broadcast error", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
