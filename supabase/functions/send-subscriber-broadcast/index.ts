// Admin-only broadcast email to all subscribers or only free-plan ones.
// Actions:
//   - { action: "preview", audience: "all"|"free", topic? }      -> AI drafts subject + body and returns recipient count
//   - { action: "send",    audience, subject, body_html, body_text? } -> sends to filtered recipients via Resend
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
// Resend só aceita 'from' em domínios verificados. Ignoramos RESEND_FROM_EMAIL
// se estiver apontando para um domínio público (gmail/hotmail/outlook/yahoo),
// para evitar 403 "domain is not verified".
const RAW_FROM = Deno.env.get("RESEND_FROM_EMAIL") || "";
const FALLBACK_FROM = "Focus Gestão Inteligente <noreply@focusinteligente.com.br>";
const PUBLIC_DOMAINS = /@(gmail|hotmail|outlook|live|yahoo|icloud|proton(?:mail)?)\.[a-z.]+>?\s*$/i;
const FROM_EMAIL = RAW_FROM && !PUBLIC_DOMAINS.test(RAW_FROM) ? RAW_FROM : FALLBACK_FROM;

type Audience = "all" | "free";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function listRecipients(admin: any, audience: Audience) {
  // Get user_ids matching audience from subscriptions
  let q = admin.from("subscriptions").select("user_id, plan");
  if (audience === "free") q = q.eq("plan", "gratuito");
  const { data: subs, error } = await q;
  if (error) throw error;
  const userIds: string[] = (subs ?? []).map((s: any) => s.user_id);

  // Resolve emails via auth.admin (page through up to 1000 users; matches existing app scale)
  const recipients: Array<{ user_id: string; email: string }> = [];
  const { data: usersPage } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const map = new Map<string, string>();
  for (const u of usersPage?.users ?? []) {
    if (u.email) map.set(u.id, u.email);
  }
  for (const uid of userIds) {
    const email = map.get(uid);
    if (email) recipients.push({ user_id: uid, email });
  }

  // Filter suppressed
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

      const prompt = `Você é um copywriter sênior de B2B SaaS. Escreva um e-mail de broadcast em português para ${
        audience === "free"
          ? "usuários do plano GRATUITO do Focus (Hub Empresarial), incentivando-os a upgrade para o plano Plus"
          : "TODA a base de assinantes do Focus (Hub Empresarial - gestão para agências, freelancers e PMEs), comunicando novidades e reforçando valor"
      }.

${topic ? `Tópico/ângulo desejado pelo admin: "${topic}"` : "Sem tópico específico — proponha um ângulo relevante e atual."}

Tom humano, direto, no máximo 180 palavras. Assinatura: "Equipe Focus". NÃO inclua rodapé de unsubscribe.

Responda APENAS um JSON válido, sem markdown:
{
  "subject": "linha de assunto curta e clara",
  "body_html": "HTML simples com <p>, <strong>, <a href>",
  "body_text": "versão texto puro equivalente"
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

      return json(200, {
        audience,
        total_recipients: recipients.length,
        sample: recipients.slice(0, 5).map((r) => r.email),
        subject: String(parsed.subject || ""),
        body_html: String(parsed.body_html || ""),
        body_text: String(parsed.body_text || ""),
      });
    }

    if (action === "send") {
      const subject = String(body?.subject || "").trim();
      const bodyHtml = String(body?.body_html || "").trim();
      const bodyText = String(body?.body_text || "").trim();
      if (!subject || !bodyHtml) return json(400, { error: "subject and body_html required" });

      const recipients = await listRecipients(admin, audience);
      let sent = 0;
      let failed = 0;

      for (const r of recipients) {
        try {
          const resendRes = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${RESEND_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: FROM_EMAIL,
              to: [r.email],
              subject,
              html: bodyHtml,
              text: bodyText || undefined,
            }),
          });
          const data = await resendRes.json();
          if (!resendRes.ok) {
            failed++;
            await admin.from("email_send_log").insert({
              recipient_email: r.email,
              status: "failed",
              template_name: "subscriber_broadcast",
              error_message: JSON.stringify(data).slice(0, 500),
              metadata: { audience },
            });
          } else {
            sent++;
            await admin.from("email_send_log").insert({
              recipient_email: r.email,
              status: "sent",
              template_name: "subscriber_broadcast",
              message_id: data.id ?? null,
              metadata: { audience },
            });
          }
          // small delay to be gentle with Resend
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
