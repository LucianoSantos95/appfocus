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

function normalizeRecipientWhatsAppNumber(raw: string) {
  const hasExplicitCountryCode = raw.trim().startsWith("+") || raw.trim().startsWith("00") || raw.includes("whatsapp:");
  let cleanNumber = raw.replace(/\D/g, "");
  if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.replace(/^0+/, "");
  if (!hasExplicitCountryCode && !cleanNumber.startsWith("55") && (cleanNumber.length === 10 || cleanNumber.length === 11)) {
    cleanNumber = "55" + cleanNumber;
  }

  return cleanNumber;
}

function normalizeSenderWhatsAppNumber(raw: string) {
  let cleanNumber = raw.replace(/\D/g, "");
  if (cleanNumber.startsWith("00")) cleanNumber = cleanNumber.slice(2);
  return cleanNumber;
}

function formatWhatsAppAddress(raw: string, type: "sender" | "recipient") {
  const normalized = type === "sender"
    ? normalizeSenderWhatsAppNumber(raw)
    : normalizeRecipientWhatsAppNumber(raw);

  return `whatsapp:+${normalized}`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!TWILIO_ACCOUNT_SID) throw new Error("TWILIO_ACCOUNT_SID not configured");
    if (!TWILIO_AUTH_TOKEN) throw new Error("TWILIO_AUTH_TOKEN not configured");
    if (!TWILIO_WHATSAPP_NUMBER) throw new Error("TWILIO_WHATSAPP_NUMBER not configured");

    // Validate auth
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
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { to, message } = await req.json();

    if (!to || !message) {
      return new Response(JSON.stringify({ error: "Missing 'to' or 'message'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanNumber = normalizeRecipientWhatsAppNumber(to);
    const cleanFrom = normalizeSenderWhatsAppNumber(TWILIO_WHATSAPP_NUMBER);

    if (cleanNumber === cleanFrom) {
      return new Response(JSON.stringify({ error: "O número de destino é o mesmo número configurado para envio no WhatsApp. Use outro número para testar." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const whatsappTo = formatWhatsAppAddress(to, "recipient");
    const whatsappFrom = formatWhatsAppAddress(TWILIO_WHATSAPP_NUMBER, "sender");

    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`);

    const response = await fetch(twilioUrl, {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        To: whatsappTo,
        From: whatsappFrom,
        Body: message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Twilio error:", data);
      if (data?.code === 63007) {
        return new Response(JSON.stringify({ error: "O número configurado em TWILIO_WHATSAPP_NUMBER não existe como remetente de WhatsApp no Twilio. Cadastre um remetente válido no Twilio e atualize esse segredo com o número exato fornecido por lá." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (data?.code === 63031) {
        return new Response(JSON.stringify({ error: "O Twilio bloqueou o envio porque o número de destino é igual ao número remetente configurado. Escolha outro WhatsApp para o teste." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Failed to send WhatsApp", details: data }), {
        status: response.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sid: data.sid }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-whatsapp error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
