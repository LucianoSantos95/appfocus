// Generate and/or send AI-crafted follow-up emails for inactive subscribers.
// Admin-only. Two actions:
//   - { action: "generate", user_id }            -> creates a draft via Lovable AI
//   - { action: "send", followup_id, subject?, body_html?, body_text? } -> sends via Resend
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const FROM_EMAIL =
  Deno.env.get("RESEND_FROM_EMAIL") ||
  "Focus Gestão Inteligente <noreply@app.focusinteligente.com.br>";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json(401, { error: "Missing Authorization" });

    // Verify caller is admin
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

    if (action === "generate") {
      return await handleGenerate(admin, caller.id, body.user_id);
    }
    if (action === "send") {
      return await handleSend(admin, body);
    }
    return json(400, { error: "Unknown action" });
  } catch (e) {
    console.error("subscriber-followup error", e);
    return json(500, { error: e instanceof Error ? e.message : "Unknown error" });
  }
});

async function handleGenerate(admin: any, callerId: string, targetUserId: string) {
  if (!targetUserId) return json(400, { error: "user_id required" });

  // Check there's no pending draft and that next_followup_at (if any) has elapsed
  const { data: history } = await admin
    .from("subscriber_followups")
    .select("id, status, sequence_step, subject, next_followup_at, sent_at")
    .eq("user_id", targetUserId)
    .order("created_at", { ascending: false });

  const openDraft = history?.find((h: any) => h.status === "draft");
  if (openDraft) {
    return json(200, { followup: openDraft, reused: true });
  }
  const last = history?.find((h: any) => h.status === "sent");
  if (last?.next_followup_at && new Date(last.next_followup_at) > new Date()) {
    return json(409, {
      error: "next_followup_locked",
      next_followup_at: last.next_followup_at,
    });
  }

  // Gather context
  const { data: profile } = await admin
    .from("profiles")
    .select("display_name, company_name, segment, employee_count, created_at")
    .eq("user_id", targetUserId)
    .maybeSingle();
  const { data: sub } = await admin
    .from("subscriptions")
    .select("plan, status, started_at, ends_at")
    .eq("user_id", targetUserId)
    .maybeSingle();

  // Recipient email via admin auth
  const { data: authUser } = await admin.auth.admin.getUserById(targetUserId);
  const recipientEmail = authUser?.user?.email;
  if (!recipientEmail) return json(400, { error: "Recipient email not found" });
  const lastSignIn = authUser?.user?.last_sign_in_at;

  const sentHistory = (history ?? []).filter((h: any) => h.status === "sent");
  const step = sentHistory.length + 1;

  const prompt = `Você é um copywriter sênior de B2B SaaS, com expertise em marketing de retenção e CRM comercial. Sua tarefa é escrever o ${step}º e-mail de uma sequência de reengajamento para um assinante do Focus (Hub Empresarial - gestão para agências, freelancers e PMEs).

DADOS DO ASSINANTE:
- Nome: ${profile?.display_name || "—"}
- Empresa/Operação: ${profile?.company_name || "—"}
- Segmento: ${profile?.segment || "—"}
- Tamanho da equipe: ${profile?.employee_count || "—"}
- Plano atual: ${sub?.plan || "gratuito"} (${sub?.status || "—"})
- Cadastro: ${profile?.created_at || "—"}
- Último login: ${lastSignIn || "nunca"}
- Sequência: e-mail ${step} de até 4

E-MAILS JÁ ENVIADOS (não repita ângulo nem assunto):
${sentHistory.map((s: any, i: number) => `${i + 1}. "${s.subject}"`).join("\n") || "Nenhum"}

OBJETIVO POR ETAPA:
1 = reabrir conversa, lembrar valor / curiosidade
2 = prova social + caso de uso prático
3 = urgência leve + oferta/desbloqueio (se plano gratuito, sugerir upgrade Plus)
4 = último toque honesto ("posso te tirar da lista?")

Defina também quantos dias esperar até o próximo follow-up, com base em boas práticas de cadência comercial B2B (típico: 3 a 14 dias, mais curto no início, maior conforme avança). Se for o último e-mail (step 4), retorne suggested_next_days = 0.

Responda APENAS um JSON válido, sem markdown, com este formato exato:
{
  "subject": "linha de assunto curta, em português, sem clickbait",
  "body_html": "HTML simples com <p>, <strong>, <a href>. Tom humano e direto, máx 150 palavras. Assinatura: 'Equipe Focus'. NÃO inclua rodapé de unsubscribe.",
  "body_text": "versão texto puro equivalente",
  "suggested_next_days": 5,
  "rationale": "1 frase explicando por que esse ângulo e essa cadência"
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
  try {
    parsed = JSON.parse(content);
  } catch {
    return json(500, { error: "AI returned invalid JSON", raw: content });
  }

  const { data: inserted, error: insErr } = await admin
    .from("subscriber_followups")
    .insert({
      user_id: targetUserId,
      recipient_email: recipientEmail,
      sequence_step: step,
      status: "draft",
      subject: String(parsed.subject || "").slice(0, 200),
      body_html: String(parsed.body_html || ""),
      body_text: String(parsed.body_text || ""),
      ai_rationale: String(parsed.rationale || ""),
      suggested_next_days: Number.isFinite(parsed.suggested_next_days)
        ? parsed.suggested_next_days
        : 7,
      created_by: callerId,
    })
    .select()
    .single();

  if (insErr) return json(500, { error: insErr.message });
  return json(200, { followup: inserted, reused: false });
}

async function handleSend(admin: any, body: any) {
  const id = body.followup_id as string;
  if (!id) return json(400, { error: "followup_id required" });

  const { data: fu, error: fuErr } = await admin
    .from("subscriber_followups")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (fuErr || !fu) return json(404, { error: "Follow-up not found" });
  if (fu.status === "sent") return json(409, { error: "already_sent" });

  // Check suppression
  const { data: suppressed } = await admin
    .from("suppressed_emails")
    .select("email")
    .eq("email", fu.recipient_email)
    .maybeSingle();
  if (suppressed) return json(409, { error: "email_suppressed" });

  const subject = body.subject || fu.subject;
  const bodyHtml = body.body_html || fu.body_html;
  const bodyText = body.body_text || fu.body_text || "";

  const { sendResendEmail } = await import("../_shared/resend.ts");
  const result = await sendResendEmail({
    from: FROM_EMAIL,
    to: fu.recipient_email,
    subject,
    html: bodyHtml,
    text: bodyText,
  });
  if (!result.ok) {
    console.error("Resend gateway error", result);
    return json(500, { error: "send_failed", details: result.error });
  }


  const nextDays = Math.max(0, Number(body.suggested_next_days ?? fu.suggested_next_days ?? 7));
  const nextAt = nextDays > 0
    ? new Date(Date.now() + nextDays * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const { error: updErr } = await admin
    .from("subscriber_followups")
    .update({
      status: "sent",
      subject,
      body_html: bodyHtml,
      body_text: bodyText,
      sent_at: new Date().toISOString(),
      next_followup_at: nextAt,
      suggested_next_days: nextDays,
    })
    .eq("id", id);
  if (updErr) return json(500, { error: updErr.message });

  await admin.from("email_send_log").insert({
    recipient_email: fu.recipient_email,
    status: "sent",
    template_name: "subscriber_followup",
    message_id: resendData.id ?? null,
    metadata: { followup_id: id, step: fu.sequence_step },
  });

  return json(200, { ok: true, message_id: resendData.id, next_followup_at: nextAt });
}
