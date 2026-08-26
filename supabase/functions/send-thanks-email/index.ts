// E-mail de agradecimento (best-effort, disparado pelo Hub Central).
// Público de propósito: o visitante do catálogo não tem login.
// Segurança: o corpo do e-mail é montado 100% no servidor — o cliente só
// escolhe um "kind" de uma lista fechada e envia dados curtos e escapados.
// Não usa send-subscriber-broadcast (admin-only + resolução de audiência em
// massa + histórico de campanha), que é caro demais para 1 envio por lead.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";
import { sendResendEmail } from "../_shared/resend.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = "https://app.focusinteligente.com.br";

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
  const t = name.trim();
  if (!t || t.includes("@")) return null;
  return t.split(/\s+/)[0];
}

// Mesma identidade visual dos demais e-mails do Hub (send-subscriber-broadcast).
function renderTemplate(opts: {
  displayName: string | null;
  introHtml: string;
  blocksHtml: string;
  ctaLabel: string;
  ctaUrl: string;
  secondaryHtml?: string;
  footerNote?: string;
}) {
  const name = firstName(opts.displayName);
  const greeting = name ? `Olá, ${escapeHtml(name)}!` : "Olá!";

  return `<!doctype html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8ecf3">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a"><tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#111827 0%,#0a0e1a 100%);border:1px solid #1f2937;border-radius:16px;overflow:hidden">
<tr><td style="padding:32px 36px 0">
  <div style="font-size:13px;letter-spacing:2px;color:#3b82f6;font-weight:700;text-transform:uppercase">FOCUS · Hub Central</div>
</td></tr>
<tr><td style="padding:28px 36px 8px">
  <h1 style="margin:0;font-size:28px;line-height:1.2;color:#fff;font-weight:800">${greeting}</h1>
  <div style="margin:14px 0 0;font-size:16px;color:#cbd5e1;line-height:1.6">${opts.introHtml}</div>
</td></tr>
${opts.blocksHtml ? `<tr><td style="padding:20px 36px 8px">${opts.blocksHtml}</td></tr>` : ""}
<tr><td align="center" style="padding:20px 36px ${opts.secondaryHtml ? "10px" : "32px"}">
  <a href="${escapeHtml(safeHttpUrl(opts.ctaUrl, `${SITE_URL}/`))}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 36px;border-radius:12px;box-shadow:0 8px 24px rgba(59,130,246,.4)">
    ${escapeHtml(opts.ctaLabel)} →
  </a>
</td></tr>
${opts.secondaryHtml ? `<tr><td align="center" style="padding:0 36px 30px"><p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6">${opts.secondaryHtml}</p></td></tr>` : ""}
<tr><td style="padding:24px 36px;border-top:1px solid #1f2937">
  <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">
    ${escapeHtml(opts.footerNote || "Você está recebendo este e-mail porque pediu algo no Hub Central.")}<br/>
    Dúvidas? Responda este e-mail — estamos aqui para ajudar.<br/>
    <span style="color:#4b5563">— Equipe Focus</span>
  </p>
</td></tr>
</table></td></tr></table></body></html>`;
}

function card(titulo: string, texto: string) {
  return `<div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px;margin-bottom:10px"><strong style="color:#3b82f6;font-size:14px">${escapeHtml(titulo)}</strong><p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5">${escapeHtml(texto)}</p></div>`;
}

type Kind = "produto" | "advisor" | "feedback";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json().catch(() => ({}));

    const email = String(body?.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
      return json(400, { error: "invalid email" });
    }

    const rawKind = String(body?.kind || "");
    if (!["produto", "advisor", "feedback"].includes(rawKind)) {
      return json(400, { error: "invalid kind" });
    }
    const kind = rawKind as Kind;

    const nome = String(body?.nome || "").trim().slice(0, 100) || null;
    const produtoNome = String(body?.produto_nome || "").trim().slice(0, 120);
    const link = safeHttpUrl(String(body?.link || ""), `${SITE_URL}/`);

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Respeita a lista de supressão como os demais envios.
    const { data: suppressed } = await admin
      .from("suppressed_emails")
      .select("email")
      .eq("email", email)
      .maybeSingle();
    if (suppressed) return json(200, { ok: true, skipped: "suppressed" });

    let subject: string;
    let introHtml: string;
    let blocksHtml = "";
    let ctaLabel: string;
    let ctaUrl = link;
    let text: string;

    if (kind === "advisor") {
      subject = "Recebemos seu contato";
      introHtml = `<p>Obrigado por falar com a gente. Recebemos seu contato${produtoNome ? ` sobre <strong>${escapeHtml(produtoNome)}</strong>` : ""} e a Focus vai te retornar por e-mail para entender sua operação antes de qualquer proposta.</p>`;
      blocksHtml = card("Próximo passo", "Um de nós responde este e-mail com algumas perguntas rápidas sobre sua operação. Sem compromisso.");
      ctaLabel = "Conhecer o Hub Central";
      ctaUrl = `${SITE_URL}/`;
      text = "Recebemos seu contato. A Focus vai te retornar por e-mail para entender sua operação.";
    } else if (kind === "produto") {
      subject = produtoNome ? `Seu ${produtoNome} chegou` : "Seu material chegou";
      introHtml = `<p>Obrigado por pegar ${produtoNome ? `o <strong>${escapeHtml(produtoNome)}</strong>` : "o material"} no Hub Central. O acesso está no botão abaixo — guarde este e-mail caso precise voltar depois.</p>`;
      blocksHtml = card("Acesso garantido", "O link abaixo é o mesmo que abrimos para você na hora. Ele continua valendo.");
      ctaLabel = "Abrir agora";
      text = `Seu acesso${produtoNome ? ` a ${produtoNome}` : ""}: ${ctaUrl}`;
    } else {
      subject = "Valeu pelo feedback";
      introHtml = `<p>Obrigado por escrever. Lemos todos os feedbacks um por um — a sua opinião ajuda a decidir o que entra no Hub ainda essa semana.</p>`;
      ctaLabel = "Voltar ao Hub Central";
      ctaUrl = `${SITE_URL}/`;
      text = "Valeu pelo feedback! Sua opinião ajuda a decidir o que vem no Hub essa semana.";
    }

    const html = renderTemplate({
      displayName: nome,
      introHtml,
      blocksHtml,
      ctaLabel,
      ctaUrl,
    });

    const result = await sendResendEmail({ to: email, subject, html, text });

    await admin.from("email_send_log").insert({
      recipient_email: email,
      status: result.ok ? "sent" : "failed",
      template_name: `thanks_${kind}`,
      message_id: result.ok ? (result.id ?? null) : null,
      error_message: result.ok ? null : (result.error ?? "unknown").slice(0, 500),
      metadata: { produto: produtoNome || null },
    });

    if (!result.ok) return json(502, { error: result.error ?? "send failed" });
    return json(200, { ok: true, id: result.id ?? null });
  } catch (e) {
    console.error("send-thanks-email error", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});
