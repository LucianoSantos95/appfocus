// Checagem de tentativas de login feita no servidor.
// A trava usa e-mail + IP (e um teto por IP), então chamar isto de outro
// lugar só bloqueia o próprio IP de quem chama — nunca o login de outra pessoa.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function ipDe(req: Request): string {
  const h = req.headers;
  const bruto = h.get("cf-connecting-ip") || h.get("x-real-ip") || h.get("x-forwarded-for") || "";
  return bruto.split(",")[0].trim().slice(0, 64) || "desconhecido";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 255) {
      return json(400, { error: "invalid email" });
    }
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data, error } = await admin.rpc("login_guard_check_and_record", { p_email: email, p_ip: ipDe(req) });
    if (error) {
      console.error("login-guard rpc error", error);
      return json(200, { allowed: true }); // falha da trava não impede o login
    }
    return json(200, data);
  } catch (e) {
    console.error("login-guard error", e);
    return json(200, { allowed: true });
  }
});
