import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Lightweight sink for front-end runtime errors (window.onerror / unhandledrejection).
// No auth required — errors can happen while logged out. Service role does the insert.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  try {
    const { message, stack, url, user_id } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), { status: 400, headers: corsHeaders });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false },
    });

    await admin.from("client_errors").insert({
      user_id: user_id ?? null,
      message: String(message).slice(0, 1000),
      stack: stack ? String(stack).slice(0, 4000) : null,
      url: url ? String(url).slice(0, 500) : null,
      user_agent: req.headers.get("user-agent")?.slice(0, 300) ?? null,
    });

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (_e) {
    // Never let the logger itself throw back to the client.
    return new Response(JSON.stringify({ ok: false }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
