import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "https://esm.sh/jspdf@2.5.1";
import autoTable from "https://esm.sh/jspdf-autotable@3.8.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReportSection {
  title: string;
  kpis?: { label: string; value: string }[];
  rows?: { columns: string[]; data: string[][] };
  notes?: string;
}

interface ReportPayload {
  modulo: string;
  secao: string;
  titulo: string;
  subtitulo?: string;
  periodo?: string;
  sections: ReportSection[];
  formato: "pdf" | "html" | "texto";
  canal: "email" | "whatsapp";
  destinatario: string;
  destinatario_nome?: string;
  empresa?: string;
}

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function normalizeRecipientWhatsAppNumber(raw: string): string {
  const hasExplicitCountryCode = raw.trim().startsWith("+") || raw.trim().startsWith("00") || raw.includes("whatsapp:");
  let cleanNumber = raw.replace(/\D/g, "");
  if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.replace(/^0+/, "");
  if (!hasExplicitCountryCode && !cleanNumber.startsWith("55") && (cleanNumber.length === 10 || cleanNumber.length === 11)) {
    cleanNumber = "55" + cleanNumber;
  }

  return cleanNumber;
}

function normalizeSenderWhatsAppNumber(raw: string): string {
  let cleanNumber = raw.replace(/\D/g, "");
  if (cleanNumber.startsWith("00")) cleanNumber = cleanNumber.slice(2);
  return cleanNumber;
}

function formatWhatsAppAddress(raw: string, type: "sender" | "recipient"): string {
  const normalized = type === "sender"
    ? normalizeSenderWhatsAppNumber(raw)
    : normalizeRecipientWhatsAppNumber(raw);

  return `whatsapp:+${normalized}`;
}

function generatePDF(payload: ReportPayload): Uint8Array {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 30, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(payload.titulo, 14, 18);
  if (payload.subtitulo) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(payload.subtitulo, 14, 25);
  }
  y = 40;

  doc.setTextColor(30, 30, 30);
  if (payload.periodo) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "italic");
    doc.text(`Período: ${payload.periodo}`, 14, y);
    y += 8;
  }
  if (payload.empresa) {
    doc.setFontSize(10);
    doc.text(`Empresa: ${payload.empresa}`, 14, y);
    y += 8;
  }
  y += 4;

  for (const section of payload.sections) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(37, 99, 235);
    doc.text(section.title, 14, y);
    y += 7;
    doc.setTextColor(30, 30, 30);

    if (section.kpis && section.kpis.length) {
      const cols = 2;
      const colWidth = (pageWidth - 28) / cols;
      section.kpis.forEach((kpi, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = 14 + col * colWidth;
        const ky = y + row * 18;
        doc.setDrawColor(200, 200, 200);
        doc.setFillColor(245, 247, 250);
        doc.roundedRect(x, ky, colWidth - 4, 14, 2, 2, "FD");
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(kpi.label, x + 3, ky + 5);
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(kpi.value, x + 3, ky + 11);
      });
      y += Math.ceil(section.kpis.length / cols) * 18 + 4;
    }

    if (section.rows && section.rows.data.length) {
      autoTable(doc, {
        head: [section.rows.columns],
        body: section.rows.data,
        startY: y,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [37, 99, 235] },
        margin: { left: 14, right: 14 },
      });
      // @ts-ignore
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (section.notes) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "italic");
      doc.setTextColor(80, 80, 80);
      const lines = doc.splitTextToSize(section.notes, pageWidth - 28);
      doc.text(lines, 14, y);
      y += lines.length * 5 + 4;
    }
    y += 4;
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Hub Empresarial • Gerado em ${new Date().toLocaleDateString("pt-BR")} • Página ${i}/${pageCount}`,
      pageWidth / 2,
      290,
      { align: "center" },
    );
  }

  return new Uint8Array(doc.output("arraybuffer"));
}

function escapeHtml(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function generateHTMLSummary(payload: ReportPayload): string {
  const e = escapeHtml;
  const kpisHtml = payload.sections
    .map((s) => {
      const kpis = (s.kpis || [])
        .map(
          (k) => `
          <td style="padding:12px;background:#f8fafc;border-radius:8px;width:50%;">
            <div style="font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;">${e(k.label)}</div>
            <div style="font-size:18px;font-weight:bold;color:#0f172a;margin-top:4px;">${e(k.value)}</div>
          </td>`,
        )
        .join("");
      const rows = (s.rows?.data || [])
        .slice(0, 10)
        .map(
          (r) => `<tr>${r.map((c) => `<td style="padding:8px;border-bottom:1px solid #e2e8f0;font-size:13px;">${e(c)}</td>`).join("")}</tr>`,
        )
        .join("");
      const tableHead = s.rows
        ? `<table style="width:100%;border-collapse:collapse;margin-top:8px;"><thead><tr style="background:#2563eb;color:white;">${s.rows.columns
            .map((c) => `<th style="padding:8px;text-align:left;font-size:12px;">${e(c)}</th>`)
            .join("")}</tr></thead><tbody>${rows}</tbody></table>`
        : "";
      return `
        <div style="margin-bottom:24px;">
          <h2 style="font-size:16px;color:#2563eb;margin:0 0 12px 0;border-bottom:2px solid #e2e8f0;padding-bottom:6px;">${e(s.title)}</h2>
          ${kpis ? `<table style="width:100%;border-spacing:8px;border-collapse:separate;"><tr>${kpis}</tr></table>` : ""}
          ${tableHead}
          ${s.notes ? `<p style="font-size:13px;color:#64748b;font-style:italic;margin-top:8px;">${e(s.notes)}</p>` : ""}
        </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html><body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,Segoe UI,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:white;padding:32px;">
    <div style="background:#0f172a;color:white;padding:24px;border-radius:8px;margin-bottom:24px;">
      <h1 style="margin:0;font-size:22px;">${e(payload.titulo)}</h1>
      ${payload.subtitulo ? `<p style="margin:4px 0 0 0;opacity:0.8;font-size:14px;">${e(payload.subtitulo)}</p>` : ""}
      ${payload.periodo ? `<p style="margin:8px 0 0 0;font-size:13px;opacity:0.7;">📅 ${e(payload.periodo)}</p>` : ""}
    </div>
    ${payload.destinatario_nome ? `<p style="font-size:14px;color:#334155;">Olá <strong>${e(payload.destinatario_nome)}</strong>,</p>` : ""}
    <p style="font-size:14px;color:#334155;">Segue o resumo executivo solicitado:</p>
    ${kpisHtml}
    <div style="border-top:1px solid #e2e8f0;margin-top:32px;padding-top:16px;font-size:12px;color:#94a3b8;text-align:center;">
      Hub Empresarial • Relatório gerado automaticamente
    </div>
  </div>
</body></html>`;
}

function generateTextSummary(payload: ReportPayload): string {
  let text = `*${payload.titulo}*\n`;
  if (payload.subtitulo) text += `_${payload.subtitulo}_\n`;
  if (payload.periodo) text += `📅 ${payload.periodo}\n`;
  text += `\n`;
  for (const s of payload.sections) {
    text += `*${s.title}*\n`;
    for (const k of s.kpis || []) text += `• ${k.label}: ${k.value}\n`;
    if (s.notes) text += `_${s.notes}_\n`;
    text += `\n`;
  }
  text += `\n_Hub Empresarial — ${new Date().toLocaleDateString("pt-BR")}_`;
  return text;
}

async function uploadPdfToStorage(
  supabase: any,
  userId: string,
  pdfBytes: Uint8Array,
  filename: string,
): Promise<string> {
  const path = `${userId}/${Date.now()}-${filename}`;
  const { error } = await supabase.storage
    .from("relatorios-pdf")
    .upload(path, pdfBytes, { contentType: "application/pdf", upsert: false });
  if (error) throw new Error(`Storage upload failed: ${error.message}`);
  // Bucket is private — return a short-lived signed URL (7 days) instead of a public URL.
  const { data, error: signedErr } = await supabase.storage
    .from("relatorios-pdf")
    .createSignedUrl(path, 60 * 60 * 24 * 7);
  if (signedErr || !data?.signedUrl) {
    throw new Error(`Signed URL failed: ${signedErr?.message || "unknown"}`);
  }
  return data.signedUrl;
}

async function sendEmail(
  to: string,
  subject: string,
  html: string,
  pdfBytes?: Uint8Array,
  pdfName?: string,
) {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

  // Domínio verificado no Resend para esta aplicação.
  const VERIFIED_FROM = "Hub Empresarial <noreply@app.focusinteligente.com.br>";

  // Domínios públicos que NUNCA podem aparecer no "from" (Resend rejeita).
  const PUBLIC_DOMAINS = [
    "gmail.com", "googlemail.com", "hotmail.com", "outlook.com",
    "live.com", "yahoo.com", "yahoo.com.br", "icloud.com",
    "me.com", "uol.com.br", "bol.com.br", "terra.com.br",
  ];

  const rawFrom = Deno.env.get("RESEND_FROM_EMAIL")?.trim();
  // Extrai o domínio do formato "Nome <email@dominio>" ou "email@dominio".
  const match = rawFrom?.match(/<?([^<>\s@]+@([^<>\s]+))>?$/);
  const domain = match?.[2]?.toLowerCase();
  const isPublic = domain ? PUBLIC_DOMAINS.includes(domain) : false;

  // Usa o secret só se for um domínio próprio verificado; caso contrário, usa o padrão.
  const fromAddress = rawFrom && !isPublic ? rawFrom : VERIFIED_FROM;

  if (rawFrom && isPublic) {
    console.warn(
      `[send-bi-report] RESEND_FROM_EMAIL ignorado (domínio público "${domain}"). Usando remetente verificado.`,
    );
  }

  const body: any = {
    from: fromAddress,
    to: [to],
    subject,
    html,
  };
  if (pdfBytes && pdfName) {
    body.attachments = [
      { filename: pdfName, content: btoa(String.fromCharCode(...pdfBytes)) },
    ];
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error("[send-bi-report] Resend error:", res.status, err);
    if (
      err.includes("verify a domain") ||
      err.includes("testing emails") ||
      err.includes("is not verified")
    ) {
      throw new Error(
        "Não foi possível enviar o relatório: o remetente não está em um domínio verificado. Verifique o domínio no Resend ou ajuste o secret RESEND_FROM_EMAIL para um endereço do seu domínio (ex.: relatorios@app.focusinteligente.com.br).",
      );
    }
    throw new Error("Falha ao enviar o e-mail do relatório.");
  }
  return await res.json();
}

async function sendWhatsApp(to: string, message: string) {
  const sid = Deno.env.get("TWILIO_ACCOUNT_SID");
  const token = Deno.env.get("TWILIO_AUTH_TOKEN");
  const from = Deno.env.get("TWILIO_WHATSAPP_NUMBER");
  if (!sid || !token || !from) throw new Error("Twilio not configured");

  const cleanNumber = normalizeRecipientWhatsAppNumber(to);
  const cleanFrom = normalizeSenderWhatsAppNumber(from);

  if (cleanNumber === cleanFrom) {
    throw new HttpError(
      400,
      "O número de destino é o mesmo número configurado para envio no WhatsApp. Para testar, use outro número de destinatário.",
    );
  }

  const whatsappTo = formatWhatsAppAddress(to, "recipient");
  const whatsappFrom = formatWhatsAppAddress(from, "sender");
  console.log(`[send-bi-report] WhatsApp To: ${whatsappTo} (original: ${to})`);

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${btoa(`${sid}:${token}`)}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: whatsappTo, From: whatsappFrom, Body: message }),
    },
  );
  if (!res.ok) {
    const errorPayload = await res.json().catch(async () => ({ raw: await res.text() }));
    console.error("[send-bi-report] Twilio error:", res.status, errorPayload);
    if (errorPayload?.code === 63007) {
      throw new HttpError(
        400,
        "O número configurado em TWILIO_WHATSAPP_NUMBER não existe como remetente de WhatsApp no Twilio. Cadastre um remetente válido no Twilio e atualize esse segredo com o número exato fornecido por lá.",
      );
    }

    if (errorPayload?.code === 63031) {
      throw new HttpError(
        400,
        "O Twilio bloqueou o envio porque o número de destino é igual ao número remetente configurado. Escolha outro WhatsApp para o teste.",
      );
    }

    throw new Error("Falha ao enviar mensagem por WhatsApp.");
  }
  return await res.json();
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = (await req.json()) as ReportPayload;
    if (!payload.canal || !payload.destinatario || !payload.formato) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SECURITY: prevent open relay — restrict recipients to the authenticated user's own address/number.
    if (payload.canal === "email") {
      const userEmail = (user.email || "").trim().toLowerCase();
      const target = (payload.destinatario || "").trim().toLowerCase();
      if (!userEmail || target !== userEmail) {
        return new Response(
          JSON.stringify({ error: "Os relatórios por e-mail só podem ser enviados ao e-mail da conta autenticada." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    } else if (payload.canal === "whatsapp") {
      const { data: prefs } = await adminClient
        .from("whatsapp_preferences")
        .select("whatsapp_number, enabled")
        .eq("user_id", user.id)
        .maybeSingle();
      const registered = normalizeRecipientWhatsAppNumber(String(prefs?.whatsapp_number || ""));
      const requested = normalizeRecipientWhatsAppNumber(String(payload.destinatario || ""));
      if (!prefs?.enabled || !registered || registered !== requested) {
        return new Response(
          JSON.stringify({ error: "Os relatórios por WhatsApp só podem ser enviados ao número registrado e habilitado nas preferências do usuário." }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    let result: any = {};
    let pdfUrl: string | null = null;

    if (payload.canal === "email") {
      const subject = `${payload.titulo}${payload.periodo ? ` — ${payload.periodo}` : ""}`;
      if (payload.formato === "pdf") {
        const pdfBytes = generatePDF(payload);
        const html = generateHTMLSummary(payload);
        result = await sendEmail(
          payload.destinatario,
          subject,
          html,
          pdfBytes,
          `${payload.secao.replace(/\s+/g, "-")}.pdf`,
        );
      } else {
        const html = generateHTMLSummary(payload);
        result = await sendEmail(payload.destinatario, subject, html);
      }
    } else if (payload.canal === "whatsapp") {
      if (payload.formato === "pdf") {
        const pdfBytes = generatePDF(payload);
        pdfUrl = await uploadPdfToStorage(
          adminClient,
          user.id,
          pdfBytes,
          `${payload.secao.replace(/\s+/g, "-")}.pdf`,
        );
        const msg = `📊 *${payload.titulo}*\n${payload.periodo ? `📅 ${payload.periodo}\n` : ""}\n📎 Baixe o PDF completo: ${pdfUrl}\n\n_Hub Empresarial_`;
        result = await sendWhatsApp(payload.destinatario, msg);
      } else {
        const text = generateTextSummary(payload);
        result = await sendWhatsApp(payload.destinatario, text);
      }
    }

    // Audit log
    await adminClient.from("relatorios_enviados").insert({
      user_id: user.id,
      modulo: payload.modulo,
      secao: payload.secao,
      formato: payload.formato,
      canal: payload.canal,
      destinatario: payload.destinatario,
      destinatario_nome: payload.destinatario_nome,
      status: "enviado",
      pdf_url: pdfUrl,
      metadata: { provider_response: result },
    });

    return new Response(
      JSON.stringify({ success: true, pdf_url: pdfUrl }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("send-bi-report error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error instanceof HttpError ? error.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
