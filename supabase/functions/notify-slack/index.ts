import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendSlackMessage, isSlackConfigured, listPublicChannels } from "../_shared/slack.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")!;
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return json(401, { error: "Missing Authorization" });

  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData?.user) return json(401, { error: "Unauthorized" });

  if (!isSlackConfigured()) {
    return json(503, { error: "Slack não está configurado neste projeto." });
  }

  // GET → list channels (for UI dropdowns)
  if (req.method === "GET") {
    const channels = await listPublicChannels();
    return json(200, { channels });
  }

  try {
    const body = await req.json();
    const { channel, text, blocks, title, level } = body ?? {};
    if (!channel || (!text && !blocks)) {
      return json(400, { error: "channel e (text|blocks) são obrigatórios" });
    }

    const emoji = level === "urgent" ? "🚨" : level === "success" ? "✅" : level === "warning" ? "⚠️" : "📣";
    const prefix = title ? `${emoji} *${title}*\n` : `${emoji} `;

    const result = await sendSlackMessage({
      channel,
      text: `${prefix}${text ?? ""}`,
      blocks,
      username: "Hub Empresarial",
      icon_emoji: ":office:",
    });

    if (!result.ok) return json(result.status || 500, { error: result.error });
    return json(200, { ok: true, ts: result.ts });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return json(500, { error: msg });
  }
});
