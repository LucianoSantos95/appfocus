// E-mail de entrega do produto pago — mesma identidade dos demais e-mails do Hub.
// Usado pelo webhook do Asaas (liberação automática) e pelo reenvio do admin.
import { sendResendEmail } from "./resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SITE_URL = "https://app.focusinteligente.com.br";

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

function primeiroNome(nome?: string | null) {
  const t = (nome ?? "").trim();
  if (!t || t.includes("@")) return null;
  return t.split(/\s+/)[0];
}

export interface EntregaOpts {
  email: string;
  nome?: string | null;
  produtoNome: string;
  produtoSlug: string;
  linkEntrega: string | null;
  tokenAcesso: string;
}

/** Envia o e-mail de entrega e registra em email_send_log. */
export async function enviarEmailEntrega(admin: any, opts: EntregaOpts) {
  const { data: suppressed } = await admin
    .from("suppressed_emails").select("email").eq("email", opts.email).maybeSingle();
  if (suppressed) return { ok: false, skipped: "suppressed" as const };

  const paginaAcesso = `${SITE_URL}/acesso/${encodeURIComponent(opts.tokenAcesso)}`;
  const ctaUrl = safeHttpUrl(opts.linkEntrega ?? "", paginaAcesso);
  const saudacao = primeiroNome(opts.nome) ? `Olá, ${escapeHtml(primeiroNome(opts.nome)!)}!` : "Olá!";

  const { data: logRow } = await admin
    .from("email_send_log")
    .insert({
      recipient_email: opts.email,
      status: "pending",
      template_name: "entrega_produto",
      metadata: { produto: opts.produtoNome, produto_slug: opts.produtoSlug, origem: "entrega_produto" },
    })
    .select("id").maybeSingle();

  const pixelHtml = logRow?.id
    ? `<img src="${SUPABASE_URL}/functions/v1/track-email-open?m=${logRow.id}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0;opacity:0" />`
    : "";

  const html = `<!doctype html><html><body style="margin:0;padding:0;background:#0a0e1a;font-family:Inter,Arial,sans-serif;color:#e8ecf3">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0e1a"><tr><td align="center" style="padding:40px 20px">
<table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:linear-gradient(180deg,#111827 0%,#0a0e1a 100%);border:1px solid #1f2937;border-radius:16px;overflow:hidden">
<tr><td style="padding:32px 36px 0">
  <div style="font-size:13px;letter-spacing:2px;color:#3b82f6;font-weight:700;text-transform:uppercase">FOCUS · Hub Central</div>
</td></tr>
<tr><td style="padding:28px 36px 8px">
  <h1 style="margin:0;font-size:28px;line-height:1.2;color:#fff;font-weight:800">${saudacao}</h1>
  <div style="margin:14px 0 0;font-size:16px;color:#cbd5e1;line-height:1.6">
    <p style="margin:0">Pagamento confirmado. Seu acesso a <strong>${escapeHtml(opts.produtoNome)}</strong> está liberado — é só clicar no botão abaixo.</p>
  </div>
</td></tr>
<tr><td style="padding:20px 36px 8px">
  <div style="background:#0f172a;border:1px solid #1f2937;border-radius:12px;padding:18px">
    <strong style="color:#3b82f6;font-size:14px">Guarde este e-mail</strong>
    <p style="margin:6px 0 0;color:#cbd5e1;font-size:14px;line-height:1.5">O acesso também fica salvo na sua página exclusiva, que continua valendo sempre que precisar voltar.</p>
  </div>
</td></tr>
<tr><td align="center" style="padding:20px 36px 10px">
  <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:linear-gradient(135deg,#3b82f6,#2563eb);color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:16px 36px;border-radius:12px;box-shadow:0 8px 24px rgba(59,130,246,.4)">Abrir meu acesso →</a>
</td></tr>
<tr><td align="center" style="padding:0 36px 30px">
  <p style="margin:0;font-size:14px;color:#94a3b8;line-height:1.6">Sua página de acesso: <a href="${escapeHtml(paginaAcesso)}" style="color:#3b82f6;text-decoration:underline">${escapeHtml(paginaAcesso)}</a></p>
</td></tr>
<tr><td style="padding:24px 36px;border-top:1px solid #1f2937">
  <p style="margin:0;font-size:12px;color:#6b7280;line-height:1.6">Você está recebendo este e-mail porque comprou no Hub Central.<br/>Dúvidas? Responda este e-mail — estamos aqui para ajudar.<br/><span style="color:#4b5563">— Equipe Focus</span></p>
</td></tr>
${pixelHtml}
</table></td></tr></table></body></html>`;

  const text = `Pagamento confirmado! Seu acesso a ${opts.produtoNome}: ${ctaUrl}\n\nPágina de acesso: ${paginaAcesso}`;

  const result = await sendResendEmail({
    to: opts.email,
    subject: `Seu acesso a ${opts.produtoNome} está liberado`,
    html,
    text,
  });

  const registro = {
    status: result.ok ? "sent" : "failed",
    message_id: result.ok ? (result.id ?? null) : null,
    error_message: result.ok ? null : (result.error ?? "unknown").slice(0, 500),
  };
  if (logRow?.id) await admin.from("email_send_log").update(registro).eq("id", logRow.id);

  return { ok: result.ok, error: result.error };
}
