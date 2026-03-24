import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const TWILIO_WHATSAPP_NUMBER = Deno.env.get("TWILIO_WHATSAPP_NUMBER");

async function sendWhatsApp(to: string, message: string) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_WHATSAPP_NUMBER) {
    throw new Error("Twilio credentials not configured");
  }

  const cleanNumber = to.replace(/\D/g, "");
  const whatsappTo = `whatsapp:+${cleanNumber}`;
  const fromNumber = TWILIO_WHATSAPP_NUMBER.startsWith("+") ? TWILIO_WHATSAPP_NUMBER : "+" + TWILIO_WHATSAPP_NUMBER;
  const whatsappFrom = `whatsapp:${fromNumber}`;

  const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

  const response = await fetch(twilioUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: whatsappTo, From: whatsappFrom, Body: message }),
  });

  const data = await response.json();
  if (!response.ok) {
    console.error(`Twilio error sending to ${to}:`, data);
    return false;
  }
  console.log(`WhatsApp sent to ${to}, SID: ${data.sid}`);
  return true;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all users with WhatsApp enabled
    const { data: prefs, error: prefsError } = await supabase
      .from("whatsapp_preferences")
      .select("*")
      .eq("enabled", true)
      .not("whatsapp_number", "is", null);

    if (prefsError) throw prefsError;
    if (!prefs || prefs.length === 0) {
      return new Response(JSON.stringify({ message: "No users with WhatsApp enabled" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results: { user_id: string; sent: number; errors: number }[] = [];
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayStr = today.toISOString().split("T")[0];
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    for (const pref of prefs) {
      let sent = 0;
      let errors = 0;

      // 1. Tarefas vencendo nas próximas 24h
      if (pref.notify_tarefas) {
        const { data: tarefas } = await supabase
          .from("tarefas")
          .select("title, due_date, priority")
          .eq("user_id", pref.user_id)
          .in("status", ["pendente", "em_andamento"])
          .gte("due_date", todayStr)
          .lte("due_date", tomorrowStr);

        if (tarefas && tarefas.length > 0) {
          const lines = tarefas.map(
            (t: any) => `• ${t.title} (${t.priority || "normal"}) - vence ${t.due_date}`
          );
          const msg = `📋 *Focus Hub - Tarefas Urgentes*\n\nVocê tem ${tarefas.length} tarefa(s) vencendo em breve:\n\n${lines.join("\n")}\n\nAcesse: https://appfocus.lovable.app/tarefas`;
          const ok = await sendWhatsApp(pref.whatsapp_number, msg);
          ok ? sent++ : errors++;
        }
      }

      // 2. Clientes sem interação há 30+ dias
      if (pref.notify_clientes) {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

        const { data: clientes } = await supabase
          .from("clientes")
          .select("nome, empresa, ultima_interacao")
          .eq("user_id", pref.user_id)
          .eq("status", "ativo")
          .lte("ultima_interacao", thirtyDaysAgoStr);

        if (clientes && clientes.length > 0) {
          const top5 = clientes.slice(0, 5);
          const lines = top5.map(
            (c: any) => `• ${c.nome}${c.empresa ? ` (${c.empresa})` : ""} - última interação: ${c.ultima_interacao}`
          );
          const extra = clientes.length > 5 ? `\n...e mais ${clientes.length - 5} cliente(s)` : "";
          const msg = `👥 *Focus Hub - Clientes Inativos*\n\n${clientes.length} cliente(s) sem interação há 30+ dias:\n\n${lines.join("\n")}${extra}\n\nAcesse: https://appfocus.lovable.app/clientes`;
          const ok = await sendWhatsApp(pref.whatsapp_number, msg);
          ok ? sent++ : errors++;
        }
      }

      // 3. Transações pendentes próximas do vencimento
      if (pref.notify_financeiro) {
        const { data: transacoes } = await supabase
          .from("transacoes")
          .select("description, value, type, date")
          .eq("user_id", pref.user_id)
          .eq("status", "pendente")
          .gte("date", todayStr)
          .lte("date", tomorrowStr);

        if (transacoes && transacoes.length > 0) {
          const lines = transacoes.map(
            (t: any) => `• ${t.description}: R$${Number(t.value).toFixed(2)} (${t.type === "receita" ? "📈 Receita" : "📉 Despesa"}) - ${t.date}`
          );
          const msg = `💰 *Focus Hub - Alertas Financeiros*\n\nVocê tem ${transacoes.length} transação(ões) pendente(s) vencendo em breve:\n\n${lines.join("\n")}\n\nAcesse: https://appfocus.lovable.app/financas`;
          const ok = await sendWhatsApp(pref.whatsapp_number, msg);
          ok ? sent++ : errors++;
        }
      }

      results.push({ user_id: pref.user_id, sent, errors });
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("whatsapp-scheduler error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
