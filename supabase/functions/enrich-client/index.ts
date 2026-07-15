import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { enrichCompanyByWebsite, isFirecrawlConfigured } from "../_shared/firecrawl.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

// Derive a company web domain from an e-mail, skipping free/consumer providers.
const FREE_DOMAINS = new Set([
  "gmail.com", "hotmail.com", "outlook.com", "yahoo.com", "yahoo.com.br",
  "icloud.com", "live.com", "bol.com.br", "uol.com.br", "terra.com.br", "proton.me",
]);

function domainFromEmail(email: string | null): string | null {
  if (!email || !email.includes("@")) return null;
  const domain = email.split("@")[1]?.trim().toLowerCase();
  if (!domain || FREE_DOMAINS.has(domain)) return null;
  return domain;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabaseAuth.auth.getClaims(token);
    if (claimsErr || !claims?.claims?.sub) return json({ error: "Token inválido" }, 401);
    const userId = claims.claims.sub as string;

    if (!isFirecrawlConfigured()) {
      return json({ error: "Firecrawl não está conectado neste projeto." }, 503);
    }

    const { cliente_id, domain: domainOverride } = await req.json();
    if (!cliente_id) return json({ error: "cliente_id é obrigatório" }, 400);

    const service = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    // Ownership check — only enrich the caller's own client.
    const { data: cliente, error: cErr } = await service
      .from("clientes")
      .select("id, nome, email, empresa, telefone, segmento, user_id")
      .eq("id", cliente_id)
      .eq("user_id", userId)
      .maybeSingle();
    if (cErr) return json({ error: "Falha ao carregar o cliente." }, 500);
    if (!cliente) return json({ error: "Cliente não encontrado." }, 404);

    const domain = (typeof domainOverride === "string" && domainOverride.trim())
      ? domainOverride.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "")
      : domainFromEmail(cliente.email);

    if (!domain) {
      return json(
        { error: "Sem domínio para enriquecer. O e-mail do cliente é pessoal (gmail, etc.) — informe o site da empresa." },
        422
      );
    }

    const result = await enrichCompanyByWebsite(`https://${domain}`);
    if (!result.ok || !result.data) {
      return json({ error: result.error || "Não foi possível extrair dados do site desta empresa." }, result.status || 502);
    }

    const enr = result.data;

    // Non-destructive fill: only populate empty fields, never overwrite the user's data
    // or the AI-analysis fields (classificacao/potencial/palavras_chave/…).
    const patch: Record<string, unknown> = {};
    if (!cliente.empresa && enr.name) patch.empresa = enr.name;
    if (!cliente.telefone && enr.phone) patch.telefone = enr.phone;
    if (!cliente.segmento && enr.industry) patch.segmento = enr.industry;

    let updated = false;
    if (Object.keys(patch).length > 0) {
      const { error: uErr } = await service.from("clientes").update(patch).eq("id", cliente.id);
      if (!uErr) updated = true;
    }

    return json({ ok: true, enrichment: enr, filled: patch, updated, domain });
  } catch (e) {
    console.error("enrich-client error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro interno" }, 500);
  }
});
