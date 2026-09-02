// Job diário de cross-sell: oferece a quem já baixou algo o produto MENOS
// clicado até o momento (recalculado a cada envio), pulando o que a pessoa
// já baixou e o que já foi oferecido antes.
//
// Timing: 1º envio 10 dias após o lead mais antigo daquele e-mail; depois,
// a cada 13 dias contados do cross-sell anterior. Teto de 3 envios por e-mail.
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const DIAS_PRIMEIRO = 10;
const DIAS_INTERVALO = 13;
const MAX_ENVIOS = 3;
const TEMPLATE = "crosssell_produto";
const LOTE_MAX = 50; // teto de trabalho por execução

Deno.serve(async (req) => {
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const bearer = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const token = req.headers.get("x-cron-token") ?? new URL(req.url).searchParams.get("token") ?? bearer;
  let autorizado = bearer !== "" && bearer === SERVICE_ROLE;
  if (!autorizado && token) {
    const { data: ok } = await admin.rpc("verify_cron_token", { p_token: token });
    autorizado = !!ok;
  }
  if (!autorizado) return new Response("Unauthorized", { status: 401 });

  const agora = Date.now();

  // 1. Leads: primeiro download por e-mail + tudo que cada e-mail já baixou.
  const { data: leads, error: erroLeads } = await admin
    .from("leads")
    .select("email,nome,produto,created_at,status")
    .neq("status", "legado");
  if (erroLeads) {
    console.error("cron-crosssell leads error", erroLeads);
    return new Response(JSON.stringify({ error: erroLeads.message }), { status: 500 });
  }

  const primeiro = new Map<string, number>();
  const nomePorEmail = new Map<string, string | null>();
  const baixados = new Map<string, Set<string>>();
  for (const l of leads ?? []) {
    const email = String(l.email ?? "").trim().toLowerCase();
    if (!email) continue;
    const t = new Date(l.created_at as string).getTime();
    if (!primeiro.has(email) || t < primeiro.get(email)!) primeiro.set(email, t);
    if (!nomePorEmail.get(email)) nomePorEmail.set(email, (l.nome as string) ?? null);
    if (l.produto) {
      const set = baixados.get(email) ?? new Set<string>();
      set.add(String(l.produto));
      baixados.set(email, set);
    }
  }

  // 2. Histórico de cross-sell por e-mail (contagem, último envio, ofertados).
  const { data: logs } = await admin
    .from("email_send_log")
    .select("recipient_email,created_at,metadata,status")
    .eq("template_name", TEMPLATE);

  const hist = new Map<string, { n: number; ultimo: number; ofertados: Set<string> }>();
  for (const g of logs ?? []) {
    if (g.status === "failed") continue;
    const email = String(g.recipient_email ?? "").trim().toLowerCase();
    if (!email) continue;
    const h = hist.get(email) ?? { n: 0, ultimo: 0, ofertados: new Set<string>() };
    h.n++;
    const t = new Date(g.created_at as string).getTime();
    if (t > h.ultimo) h.ultimo = t;
    const slug = (g.metadata as Record<string, unknown> | null)?.produto_slug;
    if (slug) h.ofertados.add(String(slug));
    hist.set(email, h);
  }

  // 3. Ranking de produtos ativos por cliques acumulados (menos clicado primeiro).
  const { data: produtos } = await admin
    .from("produtos")
    .select("slug,nome,ativo")
    .eq("ativo", true);
  const { data: cliques } = await admin
    .from("eventos")
    .select("produto")
    .eq("tipo", "clique_produto");

  const cliquesPorSlug = new Map<string, number>();
  for (const e of cliques ?? []) {
    const s = String(e.produto ?? "");
    if (s) cliquesPorSlug.set(s, (cliquesPorSlug.get(s) ?? 0) + 1);
  }
  const ranking = (produtos ?? [])
    .map((p) => ({ slug: p.slug as string, nome: p.nome as string, cliques: cliquesPorSlug.get(p.slug as string) ?? 0 }))
    .sort((a, b) => a.cliques - b.cliques || a.slug.localeCompare(b.slug));

  // 4. Quem está na janela hoje.
  let enviados = 0;
  let falhas = 0;
  let semProduto = 0;
  let candidatos = 0;

  for (const [email, tPrimeiro] of primeiro) {
    if (enviados + falhas >= LOTE_MAX) break;
    const h = hist.get(email);
    const n = h?.n ?? 0;
    if (n >= MAX_ENVIOS) continue;

    const base = n === 0 ? tPrimeiro : h!.ultimo;
    const espera = (n === 0 ? DIAS_PRIMEIRO : DIAS_INTERVALO) * 86400000;
    if (agora - base < espera) continue;

    candidatos++;

    const bloqueados = new Set<string>([...(baixados.get(email) ?? []), ...(h?.ofertados ?? [])]);
    const escolhido = ranking.find((p) => !bloqueados.has(p.slug));
    if (!escolhido) {
      semProduto++;
      continue;
    }

    const res = await fetch(`${SUPABASE_URL}/functions/v1/send-thanks-email`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_ROLE}` },
      body: JSON.stringify({
        kind: "crosssell_produto",
        email,
        nome: nomePorEmail.get(email) ?? null,
        produto_slug: escolhido.slug,
        produto_nome: escolhido.nome,
      }),
    });

    if (res.ok) enviados++;
    else {
      falhas++;
      console.error("crosssell falhou", email, res.status, (await res.text()).slice(0, 200));
    }

    await new Promise((r) => setTimeout(r, 150));
  }

  return new Response(JSON.stringify({ candidatos, enviados, falhas, semProduto }), {
    headers: { "Content-Type": "application/json" },
  });
});
