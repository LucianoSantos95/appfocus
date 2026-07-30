import { createClient } from "npm:@supabase/supabase-js@2.49.4";

// cron-daily-brief — o GATILHO do gancho diário.
// Envia UMA mensagem consolidada ("Seu dia no Hub") de manhã em dias de semana,
// SÓ para usuários já ativados (fora da janela de onboarding d1/d3/d7), com opt-in
// via whatsapp_preferences, no máximo 1x/dia, e pula se não houver nada relevante.
// Sexta-feira envia a variante "Revisão da semana".
// Agendar (Supabase cron): dias úteis ~10:30 UTC (07:30 America/Sao_Paulo).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = "oluciano.dosantos@gmail.com";
const APP_URL = "https://app.focusinteligente.com.br";
const DEMO_TAG = "[DEMO]";

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }
  const cleanNumber = to.replace(/\D/g, "");
  const fromNumber = TWILIO_WHATSAPP_NUMBER.startsWith("+") ? TWILIO_WHATSAPP_NUMBER : "+" + TWILIO_WHATSAPP_NUMBER;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);
  const resp = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Basic ${credentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ To: `whatsapp:+${cleanNumber}`, From: `whatsapp:${fromNumber}`, Body: message }),
  });
  if (!resp.ok) {
    console.error(`Twilio error sending to ${to}:`, await resp.text());
    return false;
  }
  return true;
}

const brl = (n: number) => "R$ " + Math.round(n).toLocaleString("pt-BR");
const noDemo = (s?: string | null) => !(s || "").includes(DEMO_TAG);
function dayStr(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

// Monta o brief DIÁRIO (top sinais). Retorna null se não houver nada relevante.
async function buildDailyBrief(supabase: any, uid: string, firstName: string): Promise<string | null> {
  const today = dayStr(0);
  const weekAgo = dayStr(-7);
  const lines: string[] = [];

  // Contas a receber/pagar pendentes vencidas ou de hoje
  const { data: tx } = await supabase.from("transacoes").select("description,value,type,status,date")
    .eq("user_id", uid).eq("status", "pendente").lte("date", today);
  const receber = (tx || []).filter((t: any) => t.type === "receita" && noDemo(t.description));
  const pagar = (tx || []).filter((t: any) => t.type === "despesa" && noDemo(t.description));
  if (receber.length) {
    const v = receber.reduce((s: number, t: any) => s + Number(t.value), 0);
    lines.push(`🔴 ${receber.length} conta(s) a receber vencendo — ${brl(v)}`);
  }
  if (pagar.length) {
    const v = pagar.reduce((s: number, t: any) => s + Number(t.value), 0);
    lines.push(`🔴 ${pagar.length} conta(s) a pagar vencendo — ${brl(v)}`);
  }

  // Tarefas com prazo até hoje (não concluídas)
  const { data: tarefas } = await supabase.from("tarefas").select("title,due_date,status")
    .eq("user_id", uid).neq("status", "concluida").lte("due_date", today).not("due_date", "is", null);
  const tk = (tarefas || []).filter((t: any) => noDemo(t.title));
  if (tk.length) lines.push(`🔴 ${tk.length} tarefa(s) com prazo vencido/hoje`);

  // Compromissos de hoje
  const { data: ag } = await supabase.from("agenda_items").select("title,time")
    .eq("user_id", uid).eq("date", today);
  const agenda = (ag || []).filter((a: any) => noDemo(a.title));
  if (agenda.length) {
    const a = agenda[0];
    lines.push(`🗓️ ${a.title}${a.time ? ` às ${String(a.time).slice(0, 5)}` : ""}${agenda.length > 1 ? ` (+${agenda.length - 1})` : ""}`);
  }

  // Vitória: recebido na semana
  const { data: pagos } = await supabase.from("transacoes").select("description,value,type,status,date")
    .eq("user_id", uid).eq("type", "receita").eq("status", "pago").gt("date", weekAgo);
  const recebido = (pagos || []).filter((t: any) => noDemo(t.description)).reduce((s: number, t: any) => s + Number(t.value), 0);
  if (recebido > 0) lines.push(`🟢 ${brl(recebido)} recebidos nesta semana`);

  if (lines.length === 0) return null; // nada relevante — não manda "bom dia vazio"

  const hi = firstName ? `Bom dia, ${firstName}!` : "Bom dia!";
  return `☀️ *${hi}* Hoje no seu Hub:\n\n${lines.slice(0, 4).join("\n")}\n\nAbra e resolva: ${APP_URL}`;
}

// Monta a REVISÃO DA SEMANA (sexta).
async function buildWeeklyReview(supabase: any, uid: string, firstName: string): Promise<string | null> {
  const today = dayStr(0);
  const weekAgo = dayStr(-7);
  const { data: pagos } = await supabase.from("transacoes").select("description,value,type,status,date")
    .eq("user_id", uid).eq("status", "pago").gt("date", weekAgo);
  const real = (pagos || []).filter((t: any) => noDemo(t.description));
  const rec = real.filter((t: any) => t.type === "receita").reduce((s: number, t: any) => s + Number(t.value), 0);
  const desp = real.filter((t: any) => t.type === "despesa").reduce((s: number, t: any) => s + Number(t.value), 0);
  const saldo = rec - desp;

  const { data: conc } = await supabase.from("tarefas").select("title,completed_at")
    .eq("user_id", uid).eq("status", "concluida").gt("completed_at", weekAgo + "T00:00:00");
  const concN = (conc || []).filter((t: any) => noDemo(t.title)).length;

  const { data: prop } = await supabase.from("transacoes").select("description,value,type,status")
    .eq("user_id", uid).eq("type", "receita").eq("status", "pendente");
  const propostas = (prop || []).filter((t: any) => noDemo(t.description));
  const propVal = propostas.reduce((s: number, t: any) => s + Number(t.value), 0);

  if (rec === 0 && desp === 0 && concN === 0 && propostas.length === 0) return null;

  const lines = [
    `💰 Saldo da semana: ${saldo >= 0 ? "+" : "−"}${brl(Math.abs(saldo))}`,
    `✅ ${concN} tarefa(s) concluída(s)`,
  ];
  if (propostas.length) lines.push(`🟡 ${propostas.length} proposta(s) aguardando — ${brl(propVal)}`);

  const hi = firstName ? `Sexta, ${firstName}!` : "Sexta!";
  return `📊 *${hi}* Sua semana no Hub:\n\n${lines.join("\n")}\n\nPlaneje a próxima: ${APP_URL}/relatorios`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const auth = req.headers.get("Authorization")?.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth: service key OU token de cron
  if (auth !== serviceKey) {
    const { data: valid } = await supabase.rpc("verify_cron_token", { p_token: auth ?? "" });
    if (!valid) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  const isFriday = new Date().getDay() === 5;
  const dayKey = dayStr(0);
  const minSignupIso = new Date(Date.now() - 7 * 86400000).toISOString(); // fora do onboarding
  const results: any[] = [];

  try {
    // Opt-in: só quem habilitou WhatsApp e tem número
    const { data: prefs } = await supabase.from("whatsapp_preferences")
      .select("user_id, whatsapp_number").eq("enabled", true).not("whatsapp_number", "is", null);

    for (const pref of prefs || []) {
      const uid = pref.user_id;
      const { data: userData } = await supabase.auth.admin.getUserById(uid);
      const u = userData?.user;
      if (!u?.email || u.email === ADMIN_EMAIL) continue;
      if (u.created_at && u.created_at > minSignupIso) continue; // ainda em onboarding — não colidir

      // Dedup: no máximo 1 brief por dia
      const { data: already } = await supabase.from("email_automation_log").select("id")
        .eq("user_id", uid).eq("automation_type", "daily_brief")
        .filter("metadata->>day_key", "eq", dayKey).maybeSingle();
      if (already) continue;

      const { data: prof } = await supabase.from("profiles").select("display_name").eq("user_id", uid).maybeSingle();
      const firstName = (prof?.display_name || "").split(" ")[0] || "";

      const message = isFriday
        ? await buildWeeklyReview(supabase, uid, firstName)
        : await buildDailyBrief(supabase, uid, firstName);
      if (!message) continue; // nada relevante — pula (sem spam)

      const ok = await sendWhatsApp(pref.whatsapp_number, message);
      results.push({ user_id: uid, mode: isFriday ? "weekly" : "daily", status: ok ? "sent" : "failed" });

      if (ok) {
        await supabase.from("email_automation_log").insert({
          user_id: uid,
          automation_type: "daily_brief",
          sequence_step: 1,
          template_name: isFriday ? "weekly-review-whatsapp" : "daily-brief-whatsapp",
          recipient_email: u.email,
          status: "sent",
          metadata: { day_key: dayKey, mode: isFriday ? "weekly" : "daily", channel: "whatsapp" },
        });
      }
    }

    return new Response(JSON.stringify({ processed: results.length, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("cron-daily-brief error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
