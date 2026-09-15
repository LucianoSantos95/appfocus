// Reenvia o e-mail de acesso de uma compra paga. Só o dono da plataforma.
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { enviarEmailEntrega } from "../_shared/entrega-email.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OWNER_EMAIL = "oluciano.dosantos@gmail.com";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "Sessão expirada." });

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await authClient.auth.getUser(authHeader.replace("Bearer ", ""));
    const email = userData?.user?.email?.toLowerCase();
    if (!email || email !== OWNER_EMAIL) return json(403, { error: "Acesso negado." });

    const { compra_id } = await req.json().catch(() => ({}));
    if (!compra_id) return json(400, { error: "compra_id obrigatório." });

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
    const { data: compra } = await admin
      .from("compras").select("id, status, email, nome, produto_slug, produto_nome, token_acesso")
      .eq("id", compra_id).maybeSingle();
    if (!compra) return json(404, { error: "Compra não encontrada." });
    if (compra.status !== "pago") return json(400, { error: "A compra ainda não foi paga." });

    const { data: prod } = await admin
      .from("produtos").select("nome, link_destino")
      .eq("slug", compra.produto_slug).maybeSingle();
    const { data: entrega } = await admin
      .from("produto_entregas").select("link")
      .eq("produto_slug", compra.produto_slug).maybeSingle();

    const r = await enviarEmailEntrega(admin, {
      email: compra.email,
      nome: compra.nome,
      produtoNome: compra.produto_nome ?? prod?.nome ?? "seu produto",
      produtoSlug: compra.produto_slug,
      linkEntrega: entrega?.link ?? prod?.link_destino ?? null,
      tokenAcesso: compra.token_acesso,
    });
    if (!r.ok) return json(502, { error: r.error ?? "Não foi possível enviar." });
    return json(200, { ok: true });
  } catch (e) {
    console.error("reenviar-acesso-produto error", e);
    return json(500, { error: e instanceof Error ? e.message : "Erro inesperado" });
  }
});
